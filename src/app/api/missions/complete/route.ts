import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

function calcPoints(effectiveDuration: number, estimatedHours: number | null, maxPoints: number): number {
    if (!estimatedHours || estimatedHours <= 0 || effectiveDuration <= 0) return maxPoints
    return Math.min(Math.round((effectiveDuration / estimatedHours) * maxPoints), maxPoints)
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
        }

        const { missionId, commentaire, effectiveDuration, participatedAt } = await req.json()

        if (!missionId) {
            return NextResponse.json({ message: "Mission ID manquant" }, { status: 400 })
        }

        if (!effectiveDuration || parseFloat(effectiveDuration) <= 0) {
            return NextResponse.json({ message: "La durée effective est requise" }, { status: 400 })
        }

        const mission = await prisma.mission.findUnique({ where: { id: missionId } })
        if (!mission) {
            return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })
        }

        if (mission.state === "CLOSED" || mission.state === "DONE") {
            return NextResponse.json(
                { message: "Cette mission est verrouillée, la validation n'est plus possible" },
                { status: 400 }
            )
        }

        const isRecurring = mission.type === "Récurrente"
        const durationNum = parseFloat(effectiveDuration)
        const pointsAwarded = calcPoints(durationNum, mission.estimatedHours, mission.points)

        if (isRecurring) {
            // Missions récurrentes : pas d'inscription requise, participations multiples OK
            if (!participatedAt) {
                return NextResponse.json(
                    { message: "La date de participation est requise pour une mission récurrente" },
                    { status: 400 }
                )
            }

            await prisma.$transaction([
                prisma.realisation.create({
                    data: {
                        userId: session.user.id,
                        missionId,
                        commentaire: commentaire ?? null,
                        effectiveDuration: durationNum,
                        pointsAwarded,
                        participatedAt: new Date(participatedAt),
                    }
                }),
                prisma.user.update({
                    where: { id: session.user.id },
                    data: { points: { increment: pointsAwarded } }
                })
            ])

            return NextResponse.json({ message: "Participation enregistrée.", pointsAwarded }, { status: 200 })
        }

        // Missions non-récurrentes : inscription préalable requise
        const inscription = await prisma.inscription.findFirst({
            where: { userId: session.user.id, missionId }
        })
        if (!inscription) {
            return NextResponse.json(
                { message: "Vous n'étiez pas inscrit à cette mission" },
                { status: 400 }
            )
        }

        // Vérifier qu'il n'a pas déjà validé
        const existing = await prisma.realisation.findFirst({
            where: { userId: session.user.id, missionId }
        })
        if (existing) {
            return NextResponse.json(
                { message: "Vous avez déjà validé votre participation à cette mission" },
                { status: 400 }
            )
        }

        await prisma.$transaction([
            prisma.realisation.create({
                data: {
                    userId: session.user.id,
                    missionId,
                    commentaire: commentaire ?? null,
                    effectiveDuration: durationNum,
                    pointsAwarded,
                }
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: { points: { increment: pointsAwarded } }
            })
        ])

        return NextResponse.json({ message: "Participation validée.", pointsAwarded }, { status: 200 })
    } catch (error: unknown) {
        console.error('Erreur lors de la validation:', error)
        return NextResponse.json(
            { message: "Erreur lors de la validation de la participation" },
            { status: 500 }
        )
    }
}
