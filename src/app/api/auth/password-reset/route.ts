import { NextRequest, NextResponse } from 'next/server';

import { resetPassword } from '@/lib/auth';
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email requis' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Cet email ne correspond à aucun compte.' },
                { status: 404 }
            );
        }

        await resetPassword(email)

        return NextResponse.json({
            message: 'Email de réinitialisation envoyé avec succès'
        });

    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}