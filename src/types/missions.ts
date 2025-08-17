export interface UserInscrit {
    id: string[]
    name: string
}

export interface Mission {
    id: string
    mission: string
    description: string
    pole: string[]
    referant: string[]
    dureeEstimee: number
    pointsTribu: number
    nombrePersonnes: number
    nombreInscrits: number
    dateMission: string
    typeMission: string
    priorite: string
    etat: string
    tacheRealisee: string
    usersInscrits?: UserInscrit[]
    usersCompleted?: String[]
}