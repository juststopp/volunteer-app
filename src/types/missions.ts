export interface Mission {
    id: string;
    title: string;
    description: string | null;
    pole: { id: string; name: string } | null;
    date: string | null;
    estimatedHours: number | null;
    points: number;
    maxPeople: number | null;
    type: string | null;
    priority: string | null;
    state: "ACTIVE" | "CLOSED" | "DONE";
    referent: string | null;
    recurrenceCount: number | null;
    recurrenceUnit: string | null; // "jour" | "semaine" | "mois"
    inscriptions: {
        id: string;
        userId: string;
        user?: { id: string; firstname: string; lastname: string };
        availableFrom?: string | null;
        availableDuration?: number | null;
        comment?: string | null;
    }[];
    realisations: {
        id: string;
        userId: string;
        commentaire?: string | null;
        effectiveDuration?: number | null;
        pointsAwarded?: number | null;
        participatedAt?: string | null;
        createdAt?: string;
        user?: { id: string; firstname: string; lastname: string };
    }[];
}
