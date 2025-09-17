import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { airtableService } from "@/lib/airtable"

export async function POST(request: NextRequest) {
    try {
        const { firstname, lastname, email, password, phone, poleId } = await request.json()

        if (!firstname || !lastname || !email || !password || !phone || !poleId) {
            return NextResponse.json(
                { message: "Tous les champs sont requis" },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "Un utilisateur avec cet email existe déjà" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        let airtableId: string | null = null
        try {
            airtableId = await airtableService.createUser({
                firstname,
                lastname,
                email,
                phone,
                poleId
            })
        } catch (airtableError) {
            console.error('Erreur Airtable:', airtableError)
            return NextResponse.json(
                { message: "Erreur lors de la synchronisation avec Airtable" },
                { status: 500 }
            )
        }

        const user = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                password: hashedPassword,
                phone,
                poleId,
                airtableId,
            }
        })

        return NextResponse.json(
            { message: "Utilisateur créé avec succès", userId: user.id },
            { status: 201 }
        )
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error)
        return NextResponse.json(
            { message: "Erreur interne du serveur" },
            { status: 500 }
        )
    }
}