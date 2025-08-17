import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { airtableService } from '@/lib/airtable';

interface Params {
    userId: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    try {
        const waitedParams = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        if (session.user.airtableId !== waitedParams.userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const missions = await airtableService.getMissions();

        const userInscriptions = missions.filter(mission =>
            mission.usersInscrits?.some(user => user.id === waitedParams.userId) && !mission.usersCompleted?.includes(waitedParams.userId)
        );

        const userCompletedMissions = missions.filter(mission =>
            mission.usersCompleted?.includes(waitedParams.userId)
        );

        return NextResponse.json({
            inscriptions: userInscriptions,
            completed: userCompletedMissions
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des missions:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des missions' },
            { status: 500 }
        );
    }
}