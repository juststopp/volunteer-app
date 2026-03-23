import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") return null
    return session
}

export async function GET() {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const missions = await prisma.mission.findMany({
        include: {
            pole: { select: { id: true, name: true } },
            _count: { select: { inscriptions: true, realisations: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(missions)
}

export async function POST(req: NextRequest) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { title, description, poleId, date, estimatedHours, points, maxPeople, type, priority, state, referent } = await req.json()

    if (!title) {
        return NextResponse.json({ message: "Le titre est requis" }, { status: 400 })
    }

    const mission = await prisma.mission.create({
        data: {
            title,
            description: description ?? null,
            poleId: poleId || null,
            date: date ? new Date(date) : null,
            estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
            points: points ? parseInt(points) : 0,
            maxPeople: maxPeople ? parseInt(maxPeople) : null,
            type: type || null,
            priority: priority || null,
            state: state ?? "ACTIVE",
            referent: referent || null,
        }
    })

    return NextResponse.json(mission, { status: 201 })
}
