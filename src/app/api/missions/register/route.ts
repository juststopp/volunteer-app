import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { airtableService } from "@/lib/airtable"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            )
        }

        const userId = session.user.airtableId
        if (!userId) {
            return NextResponse.json(
                { message: "ID utilisateur manquant" },
                { status: 400 }
            )
        }

        const { missionId, commentaire } = await req.json()

        if (!missionId) {
            return NextResponse.json(
                { message: "Mission ID manquant" },
                { status: 400 }
            )
        }

        await airtableService.inscrireMission(missionId, userId, commentaire)
        return NextResponse.json(
            { message: "Inscription réussie" },
            { status: 200 }
        )
    } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération de la session" },
            { status: 500 }
        )
    }
}