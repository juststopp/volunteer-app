import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            )
        }

        const { missionId } = await req.json()

        if (!missionId) {
            return NextResponse.json(
                { message: "Mission ID manquant" },
                { status: 400 }
            )
        }

        const mission = await prisma.mission.findUnique({
            where: { id: missionId },
            include: { inscriptions: true }
        })

        if (!mission) {
            return NextResponse.json(
                { message: "Mission introuvable" },
                { status: 404 }
            )
        }

        if (mission.date && mission.date < new Date()) {
            return NextResponse.json(
                { message: "La date de la mission est passée" },
                { status: 400 }
            )
        }

        if (mission.maxPeople && mission.inscriptions.length >= mission.maxPeople) {
            return NextResponse.json(
                { message: "La mission est complète" },
                { status: 400 }
            )
        }

        await prisma.inscription.create({
            data: {
                userId: session.user.id,
                missionId,
            }
        })

        return NextResponse.json({ message: "Inscription réussie" }, { status: 200 })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2002") {
            return NextResponse.json(
                { message: "Vous êtes déjà inscrit à cette mission" },
                { status: 400 }
            )
        }
        console.error('Erreur lors de l\'inscription:', error)
        return NextResponse.json(
            { message: "Erreur lors de l'inscription" },
            { status: 500 }
        )
    }
}
