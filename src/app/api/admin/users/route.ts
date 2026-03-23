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

    const users = await prisma.user.findMany({
        select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
            role: true,
            validated: true,
            points: true,
            pole: { select: { id: true, name: true } },
            createdAt: true,
            _count: {
                select: { inscriptions: true, realisations: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(users)
}
