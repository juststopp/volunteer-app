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

        const { missionId, commentaire } = await req.json()

        if (!missionId) {
            return NextResponse.json(
                { message: "Mission ID manquant" },
                { status: 400 }
            )
        }

        const mission = await prisma.mission.findUnique({
            where: { id: missionId }
        })

        if (!mission) {
            return NextResponse.json(
                { message: "Mission introuvable" },
                { status: 404 }
            )
        }

        await prisma.$transaction([
            prisma.realisation.create({
                data: {
                    userId: session.user.id,
                    missionId,
                    commentaire: commentaire ?? null,
                }
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: { points: { increment: mission.points } }
            })
        ])

        return NextResponse.json({ message: "Mission complétée." }, { status: 200 })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2002") {
            return NextResponse.json(
                { message: "Vous avez déjà complété cette mission" },
                { status: 400 }
            )
        }
        console.error('Erreur lors de la complétion:', error)
        return NextResponse.json(
            { message: "Erreur lors de la complétion de la mission" },
            { status: 500 }
        )
    }
}
