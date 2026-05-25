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

export async function PATCH(
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

        const { firstname, lastname, email, phone } = await request.json();

        if (!firstname?.trim() || !lastname?.trim()) {
            return NextResponse.json({ error: 'Le prénom et le nom sont requis' }, { status: 400 });
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: 'L\'email est requis' }, { status: 400 });
        }

        // Vérifier que l'email n'est pas déjà utilisé par un autre compte
        if (email !== session.user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== userId) {
                return NextResponse.json({ error: 'Cette adresse email est déjà utilisée' }, { status: 400 });
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                firstname: firstname.trim(),
                lastname: lastname.trim(),
                email: email.trim(),
                phone: phone?.trim() || null,
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                phone: true,
                points: true,
                pole: { select: { id: true, name: true } },
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du profil' },
            { status: 500 }
        );
    }
}
