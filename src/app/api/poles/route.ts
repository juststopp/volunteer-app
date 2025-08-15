import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable"

export async function GET() {
    try {
        const poles = await airtableService.getPoles()
        return NextResponse.json(poles)
    } catch (error) {
        console.error('Erreur lors de la récupération des pôles:', error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération des pôles" },
            { status: 500 }
        )
    }
}