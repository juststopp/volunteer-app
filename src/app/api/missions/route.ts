import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { airtableService } from "@/lib/airtable"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            )
        }

        const missions = await airtableService.getMissions()
        return NextResponse.json(missions)
    } catch (error) {
        console.error('Erreur lors de la récupération des missions:', error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération des missions" },
            { status: 500 }
        )
    }
}