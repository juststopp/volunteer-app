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

// GET — missions d'un utilisateur avec statut
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: userId } = await params

    const [inscriptions, realisations] = await Promise.all([
        prisma.inscription.findMany({
            where: { userId },
            include: {
                mission: {
                    include: { pole: { select: { id: true, name: true } } }
                }
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.realisation.findMany({
            where: { userId },
            select: { missionId: true, effectiveDuration: true, pointsAwarded: true }
        })
    ])

    const completedMap = new Map(realisations.map(r => [r.missionId, r]))

    const missions = inscriptions.map(i => ({
        id: i.mission.id,
        title: i.mission.title,
        date: i.mission.date,
        points: i.mission.points,
        estimatedHours: i.mission.estimatedHours,
        state: i.mission.state,
        pole: i.mission.pole,
        inscribedAt: i.createdAt,
        availableFrom: i.availableFrom,
        availableDuration: i.availableDuration,
        completed: completedMap.has(i.mission.id),
        effectiveDuration: completedMap.get(i.mission.id)?.effectiveDuration ?? null,
        pointsAwarded: completedMap.get(i.mission.id)?.pointsAwarded ?? null,
    }))

    return NextResponse.json(missions)
}

// POST — inscrire l'utilisateur à une mission
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: userId } = await params
    const { missionId } = await req.json()

    if (!missionId)
        return NextResponse.json({ message: "missionId manquant" }, { status: 400 })

    const [mission, inscriptionCount] = await Promise.all([
        prisma.mission.findUnique({ where: { id: missionId } }),
        prisma.inscription.count({ where: { missionId } })
    ])
    if (!mission)
        return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })

    if (mission.maxPeople && inscriptionCount >= mission.maxPeople)
        return NextResponse.json({ message: "La mission est complète" }, { status: 400 })

    try {
        await prisma.inscription.create({ data: { userId, missionId } })
        return NextResponse.json({ message: "Bénévole inscrit à la mission" })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2002")
            return NextResponse.json({ message: "Ce bénévole est déjà inscrit à cette mission" }, { status: 400 })
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
    }
}

// DELETE — désinscrire l'utilisateur d'une mission
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: userId } = await params
    const { missionId } = await req.json()

    if (!missionId)
        return NextResponse.json({ message: "missionId manquant" }, { status: 400 })

    try {
        await prisma.$transaction(async (tx) => {
            const realisation = await tx.realisation.findFirst({
                where: { userId, missionId },
                select: { id: true, pointsAwarded: true }
            })
            if (realisation) {
                const mission = await tx.mission.findUnique({ where: { id: missionId } })
                await tx.realisation.delete({ where: { id: realisation.id } })
                const pointsToDeduct = realisation.pointsAwarded ?? mission?.points ?? 0
                if (pointsToDeduct > 0) {
                    await tx.user.update({ where: { id: userId }, data: { points: { decrement: pointsToDeduct } } })
                }
            }
            await tx.inscription.deleteMany({ where: { userId, missionId } })
        })
        return NextResponse.json({ message: "Bénévole retiré de la mission" })
    } catch {
        return NextResponse.json({ message: "Inscription introuvable" }, { status: 404 })
    }
}

// PATCH — basculer le statut de participation
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session)
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id: userId } = await params
    const { missionId, completed, pointsAwarded: customPoints } = await req.json()

    if (!missionId || typeof completed !== "boolean")
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
            await prisma.$transaction(async (tx) => {
                await tx.realisation.update({ where: { id: existing.id }, data: { pointsAwarded: pts } })
                if (diff !== 0) {
                    await tx.user.update({ where: { id: userId }, data: { points: { increment: diff } } })
                }
            })
            return NextResponse.json({ message: "Points modifiés", pointsAwarded: pts })
        }

        try {
            await prisma.$transaction([
                prisma.realisation.create({ data: { userId, missionId, pointsAwarded: pts } }),
                prisma.user.update({ where: { id: userId }, data: { points: { increment: pts } } })
            ])
            return NextResponse.json({ message: "Participation validée", pointsAwarded: pts })
        } catch {
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
            prisma.user.update({ where: { id: userId }, data: { points: { decrement: pointsToDeduct } } })
        ])
        return NextResponse.json({ message: "Participation annulée" })
    }
}
