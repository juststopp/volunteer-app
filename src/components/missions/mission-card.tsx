import { Mission } from "@/types/missions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Star, Target } from "lucide-react";

interface MissionCardProps {
  mission: Mission;
}

const getEtatColor = (etat: string) => {
  if (etat?.includes("Recherche"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (etat?.includes("En cours"))
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (etat?.includes("Terminé"))
    return "bg-green-100 text-green-800 border-green-200";
  if (etat?.includes("Annulé")) return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getPrioriteColor = (priorite: string) => {
  if (priorite?.includes("🔴")) return "bg-red-500 text-white";
  if (priorite?.includes("🟠")) return "bg-orange-500 text-white";
  if (priorite?.includes("🟡")) return "bg-yellow-500 text-white";
  if (priorite?.includes("🟢")) return "bg-green-500 text-white";
  return "bg-gray-500 text-white";
};

const getTypeMissionColor = (type: string) => {
  if (type === "Ponctuelle")
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (type === "Récurrente")
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const formatDuree = (dureeEnSecondes: number) => {
  const heures = Math.floor(dureeEnSecondes / 3600);
  const minutes = Math.floor((dureeEnSecondes % 3600) / 60);

  if (heures > 0) {
    return minutes > 0 ? `${heures}h${minutes}m` : `${heures}h`;
  }
  return `${minutes}m`;
};

export function MissionCard({ mission }: MissionCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const progressPercentage =
    mission.nombrePersonnes > 0
      ? Math.round((mission.nombreInscrits / mission.nombrePersonnes) * 100)
      : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {mission.mission}
            </CardTitle>
            <CardDescription className="line-clamp-3 text-sm">
              {mission.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Badge className={getEtatColor(mission.etat)} variant="outline">
              {mission.etat?.replace(/📝|🔄|✅|❌/g, "").trim()}
            </Badge>
            {mission.priorite && (
              <Badge className={getPrioriteColor(mission.priorite)}>
                {mission.priorite.replace(/🔴|🟠|🟡|🟢/g, "").trim()}
              </Badge>
            )}
            {mission.typeMission && (
              <Badge
                className={getTypeMissionColor(mission.typeMission)}
                variant="outline"
              >
                {mission.typeMission}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {mission.dateMission && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {formatDate(mission.dateMission)}
              </span>
            </div>
          )}

          {mission.dureeEstimee && (
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatDuree(mission.dureeEstimee)}</span>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              {mission.nombreInscrits}/{mission.nombrePersonnes}
            </span>
          </div>

          {mission.pointsTribu && (
            <div className="flex items-center text-gray-600">
              <Star className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{mission.pointsTribu} pts</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progression</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100
                  ? "bg-green-500"
                  : progressPercentage >= 50
                  ? "bg-blue-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {mission.pole && mission.pole.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Target className="w-4 h-4 text-gray-400 mt-1" />
            {mission.pole.slice(0, 2).map((p, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                Pôle #{p.slice(-3)}
              </Badge>
            ))}
            {mission.pole.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{mission.pole.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
