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
    }
}