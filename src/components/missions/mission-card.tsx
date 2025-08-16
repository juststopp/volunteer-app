import { Mission } from "@/types/missions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Users,
  Star,
  Target,
  MapPin,
  User,
} from "lucide-react";
import { useState } from "react";
import { Session } from "next-auth";

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

const formatDate = (dateString: string) => {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateShort = (dateString: string) => {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function MissionCard({ mission, currentUser }: MissionCardProps) {
  const [isInscrit, setIsInscrit] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isDatePassed = mission.dateMission
    ? new Date(mission.dateMission) < new Date()
    : false;
  const isFull = mission.nombreInscrits >= mission.nombrePersonnes;
  const userInscrit = currentUser?.airtableId
    ? mission.usersInscrits?.find((user) => {
        return user.id.find((id) => id === currentUser?.airtableId);
      })
    : null;
  const userCompleted = currentUser?.airtableId
    ? mission.usersCompleted?.find((user) => {
        return user.id.find((id) => id === currentUser?.airtableId);
      })
    : null;

  const handleInscription = async () => {
    setIsOpen(false);
    try {
      const response = await fetch("/api/missions/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionId: mission.id,
          commentaire: (
            document.getElementById("comment") as HTMLTextAreaElement
          ).value,
        }),
      });

      if (response.ok) {
        setIsInscrit(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription à la mission:", error);
    }
  };

  const handleParticipation = async () => {
    setIsOpen(false);
    try {
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionId: mission.id,
          commentaire: (
            document.getElementById("comment") as HTMLTextAreaElement
          ).value,
        }),
      });

      if (response.ok) {
        setHasParticipated(true);
      }
    } catch (error) {
      console.error("Erreur lors de la validation de la mission:", error);
    }
  };

  const getButtonConfig = () => {
    if (isDatePassed) {
      if (userInscrit) {
        if (userCompleted || hasParticipated) {
          return {
            text: "J'ai participé",
            variant: "default" as const,
            disabled: true,
            className: "bg-green-600 hover:bg-green-600",
          };
        }
        return {
          text: "J'ai participé",
          variant: "default" as const,
          disabled: false,
          className: "bg-green-600 hover:bg-green-700",
          onClick: handleParticipation,
        };
      } else {
        return {
          text: "Mission terminée",
          variant: "outline" as const,
          disabled: true,
          className: "opacity-50",
        };
      }
    } else {
      if (!userInscrit && !isInscrit) {
        if (isFull) {
          return {
            text: "Mission complète",
            variant: "outline" as const,
            disabled: true,
          };
        }
        return {
          text: "S'inscrire à la mission",
          variant: "default" as const,
          disabled: false,
          onClick: handleInscription,
        };
      } else {
        return {
          text: "Inscrit à la mission",
          variant: "outline" as const,
          disabled: true,
          className: "bg-green-50 border-green-200 text-green-700",
        };
      }
    }
  };

  const buttonConfig = getButtonConfig();
  return (
    <Drawer>
      <DrawerTrigger asChild>
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
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <ScrollArea className="overflow-auto p-4">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl mb-3 text-left">
              {mission.mission}
            </DrawerTitle>
            <div className="sm:w-2/3 w-full">
              <DrawerDescription className="text-left leading-relaxed sm:line-clamp-3">
                {mission.description}
              </DrawerDescription>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mission.dateMission && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-xs text-gray-600 text-center mt-1">
                    {formatDate(mission.dateMission)}
                  </p>
                </div>
              )}

              {mission.dureeEstimee && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Durée</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDuree(mission.dureeEstimee)}
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  Participants
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {mission.nombreInscrits}/{mission.nombrePersonnes}
                </p>
              </div>

              {mission.pointsTribu && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Points</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {mission.pointsTribu} pts
                  </p>
                </div>
              )}
            </div>

            {mission.pole && mission.pole.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Pôles concernés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mission.pole.map((p, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-sm py-1 px-3"
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {mission.typeMission && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Type de mission
                </h3>
                <Badge
                  className={getTypeMissionColor(mission.typeMission)}
                  variant="outline"
                >
                  {mission.typeMission}
                </Badge>
              </div>
            )}

            {mission.usersInscrits && mission.usersInscrits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Participants inscrits ({mission.usersInscrits.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mission.usersInscrits.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mission.referant && mission.referant.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Référant(s)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mission.referant.map((ref, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      {ref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {buttonConfig.disabled === true && (
              <div className="flex gap-3">
                <Button
                  className={`flex-1 ${buttonConfig.className || ""}`}
                  variant={buttonConfig.variant}
                  disabled={buttonConfig.disabled}
                >
                  {buttonConfig.text}
                </Button>
              </div>
            )}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                {buttonConfig.disabled === false && (
                  <div className="flex gap-3">
                    <Button
                      className={`flex-1 ${buttonConfig.className || ""}`}
                      variant={buttonConfig.variant}
                      disabled={buttonConfig.disabled}
                    >
                      {buttonConfig.text}
                    </Button>
                  </div>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {isDatePassed ? "Valider" : "Inscription à"} la mission
                  </DialogTitle>
                  <DialogDescription>
                    {isDatePassed ? "Valider" : "S'inscrire à"} la mission{" "}
                    {mission.mission}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="comment">Commentaire</Label>
                    <Textarea
                      id="comment"
                      placeholder="Ajouter un commentaire (optionnel)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button
                    variant="default"
                    onClick={
                      isDatePassed ? handleParticipation : handleInscription
                    }
                  >
                    {isDatePassed ? "J'ai participé" : "S'inscrire"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
