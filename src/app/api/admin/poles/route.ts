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

    const poles = await prisma.pole.findMany({
        include: {
            _count: { select: { missions: true, users: true } }
        },
        orderBy: { name: "asc" }
    })

    return NextResponse.json(poles)
}

export async function POST(req: NextRequest) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { name, description } = await req.json()

    if (!name) {
        return NextResponse.json({ message: "Le nom est requis" }, { status: 400 })
    }

    const pole = await prisma.pole.create({
        data: { name, description: description ?? null }
    })

    return NextResponse.json(pole, { status: 201 })
}
