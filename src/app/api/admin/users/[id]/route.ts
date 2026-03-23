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

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params
    const data = await req.json()

    const allowed = ["firstname", "lastname", "email", "phone", "role", "validated", "points", "poleId"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
        if (key in data) update[key] = data[key]
    }

    const user = await prisma.user.update({
        where: { id },
        data: update,
        select: { id: true, firstname: true, lastname: true, email: true, role: true, validated: true }
    })

    return NextResponse.json(user)
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params

    if (id === session.user.id) {
        return NextResponse.json({ message: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "Utilisateur supprimé" })
}
