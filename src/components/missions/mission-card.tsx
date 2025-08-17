import { Mission } from "@/types/missions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Calendar } from "lucide-react";
import { Session } from "next-auth";
import { MissionDrawer } from "@/components/missions/mission-drawer";

interface MissionCardProps {
  mission: Mission;
  currentUser?: Session["user"];
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

const formatDateShort = (dateString: string) => {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

export function MissionCard({ mission, currentUser }: MissionCardProps) {
  return (
    <MissionDrawer mission={mission} currentUser={currentUser}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 mb-2">
                {mission.mission}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm">
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {mission.dateMission && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDateShort(mission.dateMission)}</span>
              </div>
            )}

            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>
                {mission.nombreInscrits}/{mission.nombrePersonnes}
              </span>
            </div>
          </div>

          {mission.pole && mission.pole.length > 0 && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <div className="flex gap-1">
                {mission.pole.slice(0, 2).map((p, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {mission.pole.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{mission.pole.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MissionDrawer>
  );
}
