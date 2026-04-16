import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface Params { id: string }

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN")
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params

    const inscriptions = await prisma.inscription.findMany({
        where: { missionId: id },
        select: {
            createdAt: true,
            comment: true,
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

    const realisationIds = await prisma.realisation.findMany({
        where: { missionId: id },
        select: { userId: true }
    })
    const completedSet = new Set(realisationIds.map(r => r.userId))

    const participants = inscriptions.map(i => ({
        ...i.user,
        inscribedAt: i.createdAt,
        completed: completedSet.has(i.user.id),
    }))

    return NextResponse.json(participants)
}
