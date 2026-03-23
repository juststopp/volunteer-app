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
import ReactMarkdown from "react-markdown";

interface MissionCardProps {
  mission: Mission;
  currentUser?: Session["user"];
}

const getStateColor = (state: string) => {
  if (state === "ACTIVE") return "bg-blue-100 text-blue-800 border-blue-200";
  if (state === "CLOSED") return "bg-orange-100 text-orange-800 border-orange-200";
  if (state === "DONE") return "bg-green-100 text-green-800 border-green-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getStateLabel = (state: string) => {
  if (state === "ACTIVE") return "En cours";
  if (state === "CLOSED") return "Fermée";
  if (state === "DONE") return "Terminée";
  return state;
};

const getPrioriteColor = (priority: string) => {
  if (priority === "haute") return "bg-red-500 text-white";
  if (priority === "moyenne") return "bg-orange-500 text-white";
  if (priority === "basse") return "bg-green-500 text-white";
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
                {mission.title}
              </CardTitle>
              <div className="line-clamp-2 text-sm text-muted-foreground prose prose-sm max-w-none prose-p:m-0 prose-headings:text-sm prose-headings:font-normal">
                <ReactMarkdown>{mission.description ?? ""}</ReactMarkdown>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Badge className={getStateColor(mission.state)} variant="outline">
                {getStateLabel(mission.state)}
              </Badge>
              {mission.priority && (
                <Badge className={getPrioriteColor(mission.priority)}>
                  {mission.priority}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {mission.date && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDateShort(mission.date)}</span>
              </div>
            )}

            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>
                {mission.inscriptions.length}/{mission.maxPeople ?? "∞"}
              </span>
            </div>
          </div>

          {mission.pole && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <Badge variant="secondary" className="text-xs">
                {mission.pole.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </MissionDrawer>
  );
}
