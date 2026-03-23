import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const poles = await prisma.pole.findMany({
            orderBy: { name: "asc" }
        })
        return NextResponse.json(poles)
    } catch (error) {
        console.error('Erreur lors de la récupération des pôles:', error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération des pôles" },
            { status: 500 }
        )
    }
}
