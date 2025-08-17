import Airtable from 'airtable'

const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!)

export const airtableService = {
    async createUser(userData: {
        firstname: string
        lastname: string
        email: string
        phone: string
        poleId: string
    }) {
        try {
            const records = await base(process.env.AIRTABLE_USERS_TABLE!).create([
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

            return records[0].id
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur Airtable:', error)
            throw error
        }
    },

    async getPoles() {
        try {
            const records = await base(process.env.AIRTABLE_POLES_TABLE!).select({
                view: 'Grid view'
            }).all()

            return records.map((record) => ({
                id: record.id,
                name: record.fields.Name as string,
                image: (record.fields.Photo as Airtable.Attachment[])[0]
            }))
        } catch (error) {
            console.error('Erreur lors de la récupération des pôles:', error)
            throw error
        }
    },

    async getPole(poleId: string) {
        try {
            const record = await base(process.env.AIRTABLE_POLES_TABLE!).find(poleId)

            return {
                id: record.id,
                name: record.fields.Name as string,
                image: (record.fields.Photo as Airtable.Attachment[])[0]
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du pôle:', error)
            throw error
        }
    },

    async getUser(userId: string) {
        try {
            const record = await base(process.env.AIRTABLE_USERS_TABLE!).find(userId)

            return {
                id: record.id,
                firstname: record.fields['Prenom'] as string,
                lastname: record.fields['Nom'] as string,
                fullName: `${record.fields['Prenom']} ${record.fields['Nom']}`,
                email: record.fields['Adresse email'] as string,
                phone: record.fields['Téléphone'] as string,
                inscriptions: record.fields['Inscriptions'] as string[] || [],
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error)
            throw error
        }
    },

    async getUserName(userId: string) {
        try {
            const record = await base(process.env.AIRTABLE_USERS_TABLE!)
                .find(userId)

            return record.fields['Prenom'] + ' ' + record.fields['Nom']
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error)
            throw error
        }
    },

    async getMissions() {
        try {
            const records = await base(process.env.AIRTABLE_MISSIONS_TABLE!).select({
                view: 'Liste des tâches',
                sort: [{ field: 'Date de la mission', direction: 'asc' }]
            }).all()

            const missions = await Promise.all(records.map(async (record) => {
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
                            const inscriptionRecord = await base(process.env.AIRTABLE_INSCRIPTIONS_TABLE!).find(inscriptionId)
                            const userId = inscriptionRecord.fields['Nom'] as string

                            const userName = await this.getUserName(userId)
                            return {
                                id: userId,
                                name: userName
                            }
                        } catch {
                            return 'Utilisateur inconnu'
                        }
                    })
                )

                const realisationsIds = record.fields['Réalisations'] as string[] || []
                const usersCompleted = await Promise.all(
                    realisationsIds.map(async (realisationId) => {
                        try {
                            const realisationRecord = await base(process.env.AIRTABLE_REALISATIONS_TABLE!).find(realisationId)
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
                            const referantName = await this.getUserName(referantId)
                            return referantName
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
                    nombreInscrits: record.fields['Nombre d\'inscrits'] as number,
                    dateMission: record.fields['Date de la mission'] as string,
                    typeMission: record.fields['Type de mission'] as string,
                    priorite: record.fields['Degré de priorité'] as string,
                    etat: record.fields['Etat de la mission'] as string,
                    tacheRealisee: record.fields['Tâche Réalisée'] as string
                }
            }))

            return missions
        } catch (error) {
            console.error('Erreur lors de la récupération des missions:', error)
            throw error
        }
    },

    async getMission(missionId: string) {
        try {
            const record = await base(process.env.AIRTABLE_MISSIONS_TABLE!).find(missionId)

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
                        const userName = await this.getUserName(userId)
                        return userName
                    } catch {
                        return 'Utilisateur inconnu'
                    }
                })
            )

            const realisationsIds = record.fields['Réalisations'] as string[] || []
            const usersCompleted = await Promise.all(
                realisationsIds.map(async (realisationId) => {
                    try {
                        const realisationRecord = await base(process.env.AIRTABLE_REALISATIONS_TABLE!).find(realisationId)
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
                        const referantName = await this.getUserName(referantId)
                        return referantName
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
                nombreInscrits: record.fields['Nombre d\'inscrits'] as number,
                dateMission: record.fields['Date de la mission'] as string,
                typeMission: record.fields['Type de mission'] as string,
                priorite: record.fields['Degré de priorité'] as string,
                etat: record.fields['Etat de la mission'] as string,
                tacheRealisee: record.fields['Tâche Réalisée'] as string
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la mission:', error)
            throw error
        }
    },

    async inscrireMission(missionId: string, userId: string, commentaire: string) {
        try {
            await base(process.env.AIRTABLE_INSCRIPTIONS_TABLE!).create([
                {
                    fields: {
                        'Mission': [missionId],
                        'Nom': [userId],
                        'Commentaires / Précisions': commentaire
                    }
                }
            ])
        } catch (error) {
            console.error('Erreur lors de l\'inscription à la mission:', error)
            throw error
        }
    },

    async completeMission(missionId: string, userId: string, commentaire: string) {
        try {
            await base(process.env.AIRTABLE_REALISATIONS_TABLE!).create([
                {
                    fields: {
                        'Mission': [missionId],
                        'Nom': [userId],
                        'Commentaires - Précisions': commentaire
                    }
                }
            ])
        } catch (error) {
            console.error('Erreur lors de la complétion de la mission:', error)
            throw error
        }
    }
}