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
    const { name, description } = await req.json()

    const pole = await prisma.pole.update({
        where: { id },
        data: { name, description: description ?? null }
    })

    return NextResponse.json(pole)
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 403 })

    const { id } = await params
    await prisma.pole.delete({ where: { id } })
    return NextResponse.json({ message: "Pôle supprimé" })
}
