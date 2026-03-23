import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const [
        totalUsers,
        pendingUsers,
        totalMissions,
        activeMissions,
        totalInscriptions,
        totalRealisations,
        totalPoles,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { validated: false } }),
        prisma.mission.count(),
        prisma.mission.count({ where: { state: "ACTIVE" } }),
        prisma.inscription.count(),
        prisma.realisation.count(),
        prisma.pole.count(),
    ])

    return NextResponse.json({
        totalUsers,
        pendingUsers,
        totalMissions,
        activeMissions,
        totalInscriptions,
        totalRealisations,
        totalPoles,
    })
}
