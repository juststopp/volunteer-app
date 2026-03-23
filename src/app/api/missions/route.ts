import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            )
        }

        const missions = await prisma.mission.findMany({
            include: {
                pole: true,
                inscriptions: {
                    include: {
                        user: { select: { id: true, firstname: true, lastname: true } }
                    }
                },
                realisations: {
                    include: {
                        user: { select: { id: true, firstname: true, lastname: true } }
                    }
                },
            },
            orderBy: { date: "asc" }
        })

        return NextResponse.json(missions)
    } catch (error) {
        console.error('Erreur lors de la récupération des missions:', error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération des missions" },
            { status: 500 }
        )
    }
}
