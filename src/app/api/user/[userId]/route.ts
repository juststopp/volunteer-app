import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Params {
    userId: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        if (session.user.id !== userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                phone: true,
                points: true,
                validated: true,
                role: true,
                pole: { select: { id: true, name: true } },
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données utilisateur' },
            { status: 500 }
        );
    }
}
