import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface Params { id: string }

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") return null
    return session
}

function calcPoints(duration: number, estimatedHours: number | null, maxPoints: number): number {
    if (!estimatedHours || estimatedHours <= 0 || duration <= 0) return maxPoints
    return Math.min(Math.round((duration / estimatedHours) * maxPoints), maxPoints)
}

// GET — liste des participants d'une mission
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params

    const mission = await prisma.mission.findUnique({ where: { id }, select: { type: true } })
    const isRecurring = mission?.type === "Récurrente"

    if (isRecurring) {
        // Pour les missions récurrentes : on retourne directement les réalisations
        const realisations = await prisma.realisation.findMany({
            where: { missionId: id },
            select: {
                id: true,
                participatedAt: true,
                effectiveDuration: true,
                pointsAwarded: true,
                commentaire: true,
                createdAt: true,
                user: {
                    select: { id: true, firstname: true, lastname: true, email: true, phone: true }
                }
            },
            orderBy: { participatedAt: "desc" }
        })

        return NextResponse.json({ isRecurring: true, realisations })
    }

    // Missions classiques : inscriptions + réalisations
    const inscriptions = await prisma.inscription.findMany({
        where: { missionId: id },
        select: {
            createdAt: true,
            comment: true,
            availableFrom: true,
            availableDuration: true,
            user: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                    phone: true,
                }
            }
        },
        orderBy: { createdAt: "asc" }
    })

    const realisations = await prisma.realisation.findMany({
        where: { missionId: id },
        select: { id: true, userId: true, effectiveDuration: true, pointsAwarded: true }
    })
    const completedMap = new Map(realisations.map(r => [r.userId, r]))

    const participants = inscriptions.map(i => ({
        ...i.user,
        inscribedAt: i.createdAt,
        comment: i.comment,
        availableFrom: i.availableFrom,
        availableDuration: i.availableDuration,
        completed: completedMap.has(i.user.id),
        realisationId: completedMap.get(i.user.id)?.id ?? null,
        effectiveDuration: completedMap.get(i.user.id)?.effectiveDuration ?? null,
        pointsAwarded: completedMap.get(i.user.id)?.pointsAwarded ?? null,
    }))

    return NextResponse.json({ isRecurring: false, participants })
}

// POST — associer un bénévole à la mission (uniquement pour missions classiques)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: missionId } = await params
    const { userId } = await req.json()

    if (!userId)
        return NextResponse.json({ message: "userId manquant" }, { status: 400 })

    const [mission, inscriptionCount] = await Promise.all([
        prisma.mission.findUnique({ where: { id: missionId } }),
        prisma.inscription.count({ where: { missionId } })
    ])
    if (!mission)
        return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })

    if (mission.type === "Récurrente")
        return NextResponse.json({ message: "Les missions récurrentes n'ont pas d'inscriptions" }, { status: 400 })

    if (mission.maxPeople && inscriptionCount >= mission.maxPeople)
        return NextResponse.json({ message: "La mission est complète" }, { status: 400 })

    try {
        await prisma.inscription.create({ data: { userId, missionId } })
        return NextResponse.json({ message: "Bénévole associé à la mission" })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2002")
            return NextResponse.json({ message: "Ce bénévole est déjà inscrit à cette mission" }, { status: 400 })
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
    }
}

// DELETE — retirer un bénévole / supprimer une réalisation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: missionId } = await params
    const { userId, realisationId } = await req.json()

    const mission = await prisma.mission.findUnique({ where: { id: missionId } })
    if (!mission)
        return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })

    if (mission.type === "Récurrente") {
        // Supprimer une réalisation spécifique par son id
        if (!realisationId)
            return NextResponse.json({ message: "realisationId manquant" }, { status: 400 })

        const real = await prisma.realisation.findUnique({ where: { id: realisationId } })
        if (!real)
            return NextResponse.json({ message: "Réalisation introuvable" }, { status: 404 })

        const pts = real.pointsAwarded ?? 0
        await prisma.$transaction(async (tx) => {
            await tx.realisation.delete({ where: { id: realisationId } })
            if (pts > 0) {
                await tx.user.update({ where: { id: real.userId }, data: { points: { decrement: pts } } })
            }
        })
        return NextResponse.json({ message: "Participation supprimée" })
    }

    // Mission classique : retirer inscription (+ réalisation si elle existe)
    if (!userId)
        return NextResponse.json({ message: "userId manquant" }, { status: 400 })

    try {
        await prisma.$transaction(async (tx) => {
            const realisation = await tx.realisation.findFirst({
                where: { userId, missionId },
                select: { id: true, pointsAwarded: true }
            })
            if (realisation) {
                await tx.realisation.delete({ where: { id: realisation.id } })
                const pts = realisation.pointsAwarded ?? mission.points ?? 0
                if (pts > 0) {
                    await tx.user.update({ where: { id: userId }, data: { points: { decrement: pts } } })
                }
            }
            await tx.inscription.deleteMany({ where: { userId, missionId } })
        })
        return NextResponse.json({ message: "Bénévole retiré de la mission" })
    } catch {
        return NextResponse.json({ message: "Inscription introuvable" }, { status: 404 })
    }
}

// PATCH — basculer le statut (inscrit ↔ réalisé) pour missions classiques uniquement
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: missionId } = await params
    const { userId, completed, pointsAwarded: customPoints } = await req.json()

    if (!userId || typeof completed !== "boolean")
        return NextResponse.json({ message: "Paramètres manquants" }, { status: 400 })

    const mission = await prisma.mission.findUnique({ where: { id: missionId } })
    if (!mission)
        return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })

    if (completed) {
        const pts = (customPoints != null && customPoints >= 0) ? customPoints : mission.points

        const existing = await prisma.realisation.findFirst({
            where: { userId, missionId },
            select: { id: true, pointsAwarded: true }
        })

        if (existing) {
            const diff = pts - (existing.pointsAwarded ?? mission.points)
            await prisma.$transaction([
                prisma.realisation.update({
                    where: { id: existing.id },
                    data: { pointsAwarded: pts }
                }),
                ...(diff !== 0 ? [prisma.user.update({
                    where: { id: userId },
                    data: { points: { increment: diff } }
                })] : [])
            ])
            return NextResponse.json({ message: "Points modifiés", pointsAwarded: pts })
        }

        try {
            await prisma.$transaction([
                prisma.realisation.create({ data: { userId, missionId, pointsAwarded: pts } }),
                prisma.user.update({ where: { id: userId }, data: { points: { increment: pts } } })
            ])
            return NextResponse.json({ message: "Participation validée", pointsAwarded: pts })
        } catch (error: unknown) {
            return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
        }
    } else {
        const existing = await prisma.realisation.findFirst({
            where: { userId, missionId },
            select: { id: true, pointsAwarded: true }
        })
        if (!existing)
            return NextResponse.json({ message: "Réalisation introuvable" }, { status: 404 })

        const pointsToDeduct = existing.pointsAwarded ?? mission.points

        await prisma.$transaction([
            prisma.realisation.delete({ where: { id: existing.id } }),
            prisma.user.update({
                where: { id: userId },
                data: { points: { decrement: pointsToDeduct } }
            })
        ])
        return NextResponse.json({ message: "Participation annulée" })
    }
}
