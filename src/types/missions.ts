export interface UserInscrit {
    id: string
    name: string
}

export interface Mission {
    id: string;
    mission: string;
    description: string;
    pole: string[];
    dateMission: string;
    pointsTribu: number;
    etat: string;
    priorite: string;
    typeMission: string;
    usersInscrits: UserInscrit[];
    usersCompleted: string[];
    nombreInscrits: number;
    nombrePersonnes: number;
    dureeEstimee?: number;
    referant?: string[];
}