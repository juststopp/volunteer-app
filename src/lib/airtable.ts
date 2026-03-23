import Airtable from 'airtable'

const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!)

// ── Rate limiter : max 5 req/s ─────────────────────────────────────────
// On traite 1 requête toutes les 200ms pour ne jamais dépasser la limite.
const RATE_MS = 200
let lastCall = 0
const queue: Array<() => void> = []
let draining = false

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function drain() {
    if (draining) return
    draining = true
    while (queue.length) {
        const wait = Math.max(0, lastCall + RATE_MS - Date.now())
        if (wait) await sleep(wait)
        lastCall = Date.now()
        queue.shift()!()
    }
    draining = false
}

function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((res, rej) => {
        queue.push(() => fn().then(res, rej))
        drain()
    })
}

// ── Cache en mémoire avec TTL ──────────────────────────────────────────
const cache = new Map<string, { data: unknown; exp: number }>()
const inFlight = new Map<string, Promise<unknown>>()

// Pour les appels simples (1 seul appel Airtable) : cache + rate limit
function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = cache.get(key)
    if (hit && Date.now() < hit.exp) return Promise.resolve(hit.data as T)
    if (inFlight.has(key)) return inFlight.get(key) as Promise<T>

    const p = rateLimited(fn).then(data => {
        cache.set(key, { data, exp: Date.now() + ttlMs })
        inFlight.delete(key)
        return data
    }).catch(err => {
        inFlight.delete(key)
        throw err
    })

    inFlight.set(key, p)
    return p
}

// Pour les appels complexes (plusieurs appels Airtable en interne) :
// cache uniquement sur le résultat final, les sous-appels gèrent eux-mêmes
// leur rate limiting via cached() ou rateLimited().
function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = cache.get(key)
    if (hit && Date.now() < hit.exp) return Promise.resolve(hit.data as T)
    if (inFlight.has(key)) return inFlight.get(key) as Promise<T>

    const p = fn().then(data => {
        cache.set(key, { data, exp: Date.now() + ttlMs })
        inFlight.delete(key)
        return data
    }).catch(err => {
        inFlight.delete(key)
        throw err
    })

    inFlight.set(key, p)
    return p
}

// TTLs
const TTL_POLES = 5 * 60_000   // 5 min  – les pôles changent rarement
const TTL_USER  = 60_000        // 1 min  – compteValide peut changer
const TTL_MISSION = 30_000      // 30 s   – missions plus dynamiques

export const airtableService = {
    async createUser(userData: {
        firstname: string
        lastname: string
        email: string
        phone: string
        poleId: string
    }) {
        try {
            const records = await rateLimited(() =>
                base(process.env.AIRTABLE_USERS_TABLE!).create([
                    {
                        fields: {
                            'Nom': userData.lastname,
                            'Prenom': userData.firstname,
                            'Adresse email': userData.email,
                            'Téléphone': userData.phone,
                            'Pôle préféré': [userData.poleId]
                        }
                    }
                ])
            )
            return records[0].id
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur Airtable:', error)
            throw error
        }
    },

    async getPoles() {
        return cached('poles', TTL_POLES, () =>
            base(process.env.AIRTABLE_POLES_TABLE!).select({ view: 'Grid view' }).all()
                .then(records => records.map(record => ({
                    id: record.id,
                    name: record.fields.Name as string,
                    image: (record.fields.Photo as Airtable.Attachment[])[0]
                })))
        )
    },

    async getPole(poleId: string) {
        return cached(`pole:${poleId}`, TTL_POLES, () =>
            base(process.env.AIRTABLE_POLES_TABLE!).find(poleId)
                .then(record => ({
                    id: record.id,
                    name: record.fields.Name as string,
                    image: (record.fields.Photo as Airtable.Attachment[])[0]
                }))
        )
    },

    async getUser(userId: string) {
        return cached(`user:${userId}`, TTL_USER, () =>
            base(process.env.AIRTABLE_USERS_TABLE!).find(userId)
                .then(record => ({
                    id: record.id,
                    firstname: record.fields['Prenom'] as string,
                    lastname: record.fields['Nom'] as string,
                    fullName: `${record.fields['Prenom']} ${record.fields['Nom']}`,
                    email: record.fields['Adresse email'] as string,
                    phone: record.fields['Téléphone'] as string,
                    inscriptions: record.fields['Inscriptions'] as string[] || [],
                    points: record.fields['Points TRIBU Cumulés'] as number || 0,
                    compteValide: record.fields['Compte validé'] as boolean || false,
                }))
        )
    },

    async getUserName(userId: string) {
        const user = await this.getUser(userId)
        return user.fullName
    },

    async getMissions() {
        return withCache('missions', TTL_MISSION, async () => {
            const records = await rateLimited(() =>
                base(process.env.AIRTABLE_MISSIONS_TABLE!).select({
                    view: 'Liste des tâches',
                    sort: [{ field: 'Date de la mission', direction: 'asc' }]
                }).all()
            )

            return Promise.all(records.map(async (record) => {
                const poleIds = record.fields['Pôle'] as string[] || []
                const poleNames = await Promise.all(
                    poleIds.map(async (poleId) => {
                        try {
                            const pole = await this.getPole(poleId)
                            return pole.name
                        } catch {
                            return 'Pôle inconnu'
                        }
                    })
                )

                const inscriptionIds = record.fields['Inscription'] as string[] || []
                const usersInscrits = await Promise.all(
                    inscriptionIds.map(async (inscriptionId) => {
                        try {
                            const inscriptionRecord = await rateLimited(() =>
                                base(process.env.AIRTABLE_INSCRIPTIONS_TABLE!).find(inscriptionId)
                            )
                            const userId = (inscriptionRecord.fields['Nom'] as string[])?.[0]
                            const user = await this.getUser(userId)
                            return { id: userId, name: user.fullName }
                        } catch {
                            return { id: 'Utilisateur inconnu', name: 'Utilisateur inconnu' }
                        }
                    })
                )

                const realisationsIds = record.fields['Réalisations'] as string[] || []
                const usersCompleted = await Promise.all(
                    realisationsIds.map(async (realisationId) => {
                        try {
                            const realisationRecord = await rateLimited(() =>
                                base(process.env.AIRTABLE_REALISATIONS_TABLE!).find(realisationId)
                            )
                            return (realisationRecord.fields['Nom'] as string[])[0] as string
                        } catch {
                            return 'Utilisateur inconnu'
                        }
                    })
                )

                const referantIds = record.fields['Référant de mission'] as string[] || []
                const referantNoms = await Promise.all(
                    referantIds.map(async (referantId) => {
                        try {
                            return await this.getUserName(referantId)
                        } catch {
                            return 'Référant inconnu'
                        }
                    })
                )

                return {
                    id: record.id,
                    mission: record.fields.Mission as string,
                    description: record.fields.Description as string,
                    pole: poleNames,
                    referant: referantNoms,
                    usersInscrits,
                    usersCompleted,
                    dureeEstimee: record.fields['Durée Estimée'] as number,
                    pointsTribu: record.fields['Points TRIBU'] as number,
                    nombrePersonnes: record.fields['Nombre de personnes'] as number,
                    nombreInscrits: record.fields["Nombre d'inscrits"] as number,
                    dateMission: record.fields['Date de la mission'] as string,
                    typeMission: record.fields['Type de mission'] as string,
                    priorite: record.fields['Degré de priorité'] as string,
                    etat: record.fields['Etat de la mission'] as string,
                    tacheRealisee: record.fields['Tâche Réalisée'] as string
                }
            }))
        })
    },

    async getMission(missionId: string) {
        return withCache(`mission:${missionId}`, TTL_MISSION, async () => {
            const record = await rateLimited(() =>
                base(process.env.AIRTABLE_MISSIONS_TABLE!).find(missionId)
            )

            const poleIds = record.fields['Pôle'] as string[] || []
            const poleNames = await Promise.all(
                poleIds.map(async (poleId) => {
                    try {
                        const pole = await this.getPole(poleId)
                        return pole.name
                    } catch {
                        return 'Pôle inconnu'
                    }
                })
            )

            const inscriptionIds = record.fields['Inscription'] as string[] || []
            const usersInscrits = await Promise.all(
                inscriptionIds.map(async (userId) => {
                    try {
                        return await this.getUserName(userId)
                    } catch {
                        return { id: 'Utilisateur inconnu', name: 'Utilisateur inconnu' }
                    }
                })
            )

            const realisationsIds = record.fields['Réalisations'] as string[] || []
            const usersCompleted = await Promise.all(
                realisationsIds.map(async (realisationId) => {
                    try {
                        const realisationRecord = await rateLimited(() =>
                            base(process.env.AIRTABLE_REALISATIONS_TABLE!).find(realisationId)
                        )
                        return (realisationRecord.fields['Nom'] as string[])[0] as string
                    } catch {
                        return 'Utilisateur inconnu'
                    }
                })
            )

            const referantIds = record.fields['Référant de mission'] as string[] || []
            const referantNoms = await Promise.all(
                referantIds.map(async (referantId) => {
                    try {
                        return await this.getUserName(referantId)
                    } catch {
                        return 'Référant inconnu'
                    }
                })
            )

            return {
                id: record.id,
                mission: record.fields.Mission as string,
                description: record.fields.Description as string,
                pole: poleNames,
                referant: referantNoms,
                inscription: record.fields['Inscription'] as string[],
                usersInscrits,
                usersCompleted,
                dureeEstimee: record.fields['Durée Estimée'] as number,
                pointsTribu: record.fields['Points TRIBU'] as number,
                nombrePersonnes: record.fields['Nombre de personnes'] as number,
                nombreInscrits: record.fields["Nombre d'inscrits"] as number,
                dateMission: record.fields['Date de la mission'] as string,
                typeMission: record.fields['Type de mission'] as string,
                priorite: record.fields['Degré de priorité'] as string,
                etat: record.fields['Etat de la mission'] as string,
                tacheRealisee: record.fields['Tâche Réalisée'] as string
            }
        })
    },

    async inscrireMission(missionId: string, userId: string, commentaire: string) {
        try {
            await rateLimited(() =>
                base(process.env.AIRTABLE_INSCRIPTIONS_TABLE!).create([
                    {
                        fields: {
                            'Mission': [missionId],
                            'Nom': [userId],
                            'Commentaires / Précisions': commentaire
                        }
                    }
                ])
            )
            cache.delete('missions')
            cache.delete(`mission:${missionId}`)
        } catch (error) {
            console.error('Erreur lors de l\'inscription à la mission:', error)
            throw error
        }
    },

    async completeMission(missionId: string, userId: string, commentaire: string) {
        try {
            await rateLimited(() =>
                base(process.env.AIRTABLE_REALISATIONS_TABLE!).create([
                    {
                        fields: {
                            'Mission': [missionId],
                            'Nom': [userId],
                            'Commentaires - Précisions': commentaire
                        }
                    }
                ])
            )
            cache.delete('missions')
            cache.delete(`mission:${missionId}`)
        } catch (error) {
            console.error('Erreur lors de la complétion de la mission:', error)
            throw error
        }
    }
}
