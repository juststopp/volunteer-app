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
    inscriptions: {
        id: string;
        userId: string;
        user: { id: string; firstname: string; lastname: string };
    }[];
    realisations: {
        id: string;
        userId: string;
        user: { id: string; firstname: string; lastname: string };
    }[];
}
