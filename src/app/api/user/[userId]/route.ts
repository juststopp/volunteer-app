import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { airtableService } from '@/lib/airtable';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        params = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        if (session.user.airtableId !== params.userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const userData = await airtableService.getUser(params.userId);

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données utilisateur' },
            { status: 500 }
        );
    }
}