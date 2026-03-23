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

        const [inscriptions, realisations] = await Promise.all([
            prisma.inscription.findMany({
                where: { userId },
                include: {
                    mission: { include: { pole: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.realisation.findMany({
                where: { userId },
                include: {
                    mission: { include: { pole: true } }
                },
                orderBy: { createdAt: 'desc' }
            })
        ])

        const completedMissionIds = new Set(realisations.map(r => r.missionId))

        return NextResponse.json({
            inscriptions: inscriptions
                .filter(i => !completedMissionIds.has(i.missionId))
                .map(i => i.mission),
            completed: realisations.map(r => r.mission),
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des missions:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des missions' },
            { status: 500 }
        );
    }
}
