import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") return null
    return session
}

interface Params { id: string }

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params

    const mission = await prisma.mission.findUnique({
        where: { id },
        include: { pole: true }
    })

    if (!mission) return NextResponse.json({ message: "Mission introuvable" }, { status: 404 })

    return NextResponse.json(mission)
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params
    const body = await req.json()

    const mission = await prisma.mission.update({
        where: { id },
        data: {
            title: body.title,
            description: body.description ?? null,
            poleId: body.poleId || null,
            date: body.date ? new Date(body.date) : null,
            estimatedHours: body.estimatedHours ? parseFloat(body.estimatedHours) : null,
            points: body.points !== undefined ? parseInt(body.points) : undefined,
            maxPeople: body.maxPeople ? parseInt(body.maxPeople) : null,
            type: body.type || null,
            priority: body.priority || null,
            state: body.state,
            referent: body.referent || null,
        }
    })

    return NextResponse.json(mission)
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params
    await prisma.mission.delete({ where: { id } })
    return NextResponse.json({ message: "Mission supprimée" })
}
