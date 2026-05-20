"use client";

import { Mission } from "@/types/missions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Session } from "next-auth";
import { toast } from "sonner";

interface MissionDrawerProps {
  mission: Mission;
  currentUser?: Session["user"];
  children: React.ReactNode;
  onRefresh?: () => void;
}

const getTypeMissionColor = (type: string) => {
  if (type === "Ponctuelle")
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (type === "Récurrente")
    return "bg-[#E0F6F7] text-[#004F4F] border-[#69C3D2]";
  return "bg-gray-100 text-gray-800 border-gray-200";
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
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getInitials = (firstname: string, lastname: string) => {
  return (firstname[0] + lastname[0]).toUpperCase();
};

/** Calcule les points en prorata, plafonné au max. */
function calcPoints(duration: number, estimatedHours: number | null, maxPoints: number): number {
  if (!estimatedHours || estimatedHours <= 0 || duration <= 0) return maxPoints;
  return Math.min(Math.round((duration / estimatedHours) * maxPoints), maxPoints);
}

const recurrenceLabel = (count: number | null, unit: string | null) => {
  if (!count || !unit) return null;
  return `${count} fois par ${unit}`;
};

export function MissionDrawer({
  mission,
  currentUser,
  children,
  onRefresh,
}: MissionDrawerProps) {
  const isRecurring = mission.type === "Récurrente";

  // ── États communs ──
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [effectiveDuration, setEffectiveDuration] = useState("");
  const [comment, setComment] = useState("");

  // ── États mission classique ──
  const [isInscrit, setIsInscrit] = useState(false);
  const [isDesinscrit, setIsDesinscrit] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isDesinscritDialogOpen, setIsDesinscritDialogOpen] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableDuration, setAvailableDuration] = useState("");
  const [showAvailability, setShowAvailability] = useState(false);

  // ── États mission récurrente ──
  const [participatedAt, setParticipatedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const isClosed = mission.state === "CLOSED" || mission.state === "DONE";
  const isDatePassed = mission.date ? new Date(mission.date) < new Date() : false;
  const userInscrit = currentUser?.id
    ? mission.inscriptions?.find((i) => i.userId === currentUser.id)
    : null;
  const userCompleted = currentUser?.id
    ? mission.realisations?.find((r) => r.userId === currentUser.id)
    : null;

  const availableDurationNum = parseFloat(availableDuration) || 0;
  const effectiveDurationNum = parseFloat(effectiveDuration) || 0;
  const estimatedPoints = calcPoints(availableDurationNum, mission.estimatedHours, mission.points);
  const actualPoints = calcPoints(effectiveDurationNum, mission.estimatedHours, mission.points);

  const resetForm = () => {
    setAvailableFrom("");
    setAvailableDuration("");
    setShowAvailability(false);
    setEffectiveDuration("");
    setComment("");
    setParticipatedAt(new Date().toISOString().slice(0, 10));
  };

  // ── Handlers ──

  const handleRecurringParticipation = async () => {
    if (!participatedAt) {
      toast.error("Veuillez indiquer la date de votre participation.");
      return;
    }
    if (!effectiveDuration || effectiveDurationNum <= 0) {
      toast.error("Veuillez renseigner votre durée de participation.");
      return;
    }

    setIsDialogOpen(false);
    resetForm();

    try {
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          commentaire: comment || null,
          effectiveDuration: effectiveDurationNum,
          participatedAt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Participation enregistrée ! +${data.pointsAwarded ?? actualPoints} pts TRIBU`);
        onRefresh?.();
      } else {
        const data = await response.json();
        toast.error(data.message ?? "Erreur lors de l'enregistrement.");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement de la participation.");
    }
  };

  const handleInscription = async () => {
    let availableFromISO: string | null = null;
    if (availableFrom) {
      const missionDatePart = mission.date
        ? new Date(mission.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      availableFromISO = `${missionDatePart}T${availableFrom}:00`;
    }

    setIsDialogOpen(false);
    resetForm();

    try {
      const response = await fetch("/api/missions/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          comment: comment || null,
          availableFrom: availableFromISO,
          availableDuration: availableDurationNum || null,
        }),
      });

      if (response.ok) {
        setIsInscrit(true);
        toast.success("Vous êtes inscrit à la mission !");
      } else {
        const data = await response.json();
        toast.error(data.message ?? "Erreur lors de l'inscription.");
      }
    } catch {
      toast.error("Erreur lors de l'inscription à la mission.");
    }
  };

  const handleDesinscription = async () => {
    setIsDesinscritDialogOpen(false);
    try {
      const response = await fetch("/api/missions/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id }),
      });

      if (response.ok) {
        setIsDesinscrit(true);
        setIsInscrit(false);
        toast.success("Vous avez été désinscrit de la mission.");
        onRefresh?.();
      } else {
        const data = await response.json();
        toast.error(data.message ?? "Erreur lors de la désinscription.");
      }
    } catch {
      toast.error("Erreur lors de la désinscription.");
    }
  };

  const handleParticipation = async () => {
    if (!effectiveDuration || effectiveDurationNum <= 0) {
      toast.error("Veuillez renseigner votre durée effective de participation.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Veuillez ajouter un commentaire pour valider votre participation.");
      return;
    }

    setIsDialogOpen(false);
    resetForm();

    try {
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          commentaire: comment,
          effectiveDuration: effectiveDurationNum,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasParticipated(true);
        toast.success(`Merci pour votre participation ! +${data.pointsAwarded ?? actualPoints} pts TRIBU`);
      } else {
        const data = await response.json();
        toast.error(data.message ?? "Erreur lors de la validation.");
      }
    } catch {
      toast.error("Erreur lors de la validation de la mission.");
    }
  };

  const getButtonConfig = () => {
    if (isDatePassed) {
      if (userInscrit) {
        if (userCompleted || hasParticipated) {
          return { text: "Participation validée", variant: "default" as const, disabled: true, className: "bg-green-600 hover:bg-green-600" };
        }
        if (isClosed) {
          return { text: "Validation verrouillée", variant: "outline" as const, disabled: true, className: "opacity-50" };
        }
        return { text: "Valider ma participation", variant: "default" as const, disabled: false, className: "bg-green-600 hover:bg-green-700" };
      } else {
        return { text: "Mission terminée", variant: "outline" as const, disabled: true, className: "opacity-50" };
      }
    } else {
      if (isClosed) {
        return { text: "Inscriptions fermées", variant: "outline" as const, disabled: true, className: "opacity-50" };
      }
      const effectivelyRegistered = (userInscrit || isInscrit) && !isDesinscrit;
      if (!effectivelyRegistered) {
        return { text: "S'inscrire à la mission", variant: "default" as const, disabled: false };
      } else {
        return { text: "Inscrit à la mission", variant: "outline" as const, disabled: true, className: "bg-green-50 border-green-200 text-green-700" };
      }
    }
  };

  const buttonConfig = !isRecurring ? getButtonConfig() : null;

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <ScrollArea className="overflow-auto p-4">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl mb-3 text-left flex items-center gap-2">
              {isRecurring && <RefreshCw className="w-5 h-5 text-[#0A9696] shrink-0" />}
              {mission.title}
            </DrawerTitle>
            <div className="sm:w-2/3 w-full">
              <DrawerDescription asChild>
                <div className="text-left leading-relaxed prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown>{mission.description ?? ""}</ReactMarkdown>
                </div>
              </DrawerDescription>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-6">
            {/* ── Infos clés ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mission.date && !isRecurring && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-[#0A9696] mb-2" />
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-xs text-gray-600 text-center mt-1">{formatDate(mission.date)}</p>
                </div>
              )}

              {isRecurring && mission.recurrenceCount && mission.recurrenceUnit && (
                <div className="flex flex-col items-center p-4 bg-[#E0F6F7] rounded-lg col-span-2 md:col-span-1">
                  <RefreshCw className="w-6 h-6 text-[#0A9696] mb-2" />
                  <p className="text-sm font-medium text-[#004F4F]">Récurrence</p>
                  <p className="text-xs text-[#0A9696] text-center mt-1 font-medium">
                    {recurrenceLabel(mission.recurrenceCount, mission.recurrenceUnit)}
                  </p>
                </div>
              )}

              {mission.estimatedHours && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Durée</p>
                  <p className="text-xs text-gray-600 mt-1">{mission.estimatedHours}h</p>
                </div>
              )}

              {!isRecurring && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Participants</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {mission.inscriptions?.length ?? 0}/{mission.maxPeople ?? "∞"}
                  </p>
                </div>
              )}

              {isRecurring && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Participations</p>
                  <p className="text-xs text-gray-600 mt-1">{mission.realisations?.length ?? 0}</p>
                </div>
              )}

              {mission.points > 0 && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Points</p>
                  <p className="text-xs text-gray-600 mt-1">{mission.points} pts</p>
                  {mission.estimatedHours && (
                    <p className="text-xs text-gray-400 mt-0.5">pour {mission.estimatedHours}h</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Pôle ── */}
            {mission.pole && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Pôle concerné
                </h3>
                <Badge variant="outline" className="text-sm py-1 px-3">{mission.pole.name}</Badge>
              </div>
            )}

            {/* ── Type ── */}
            {mission.type && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Type de mission
                </h3>
                <Badge className={getTypeMissionColor(mission.type)} variant="outline">
                  {mission.type}
                </Badge>
              </div>
            )}

            {/* ── Participants inscrits (missions classiques) ── */}
            {!isRecurring && mission.inscriptions && mission.inscriptions.some(i => i.user) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Participants inscrits ({mission.inscriptions?.length ?? 0})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mission.inscriptions.filter(i => i.user).map((inscription) => (
                    <div key={inscription.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#E0F6F7] text-[#004F4F]">
                          {getInitials(inscription.user!.firstname, inscription.user!.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">
                        {inscription.user!.firstname} {inscription.user!.lastname}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Historique des participations (missions récurrentes) ── */}
            {isRecurring && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0A9696]" />
                  Historique des participations
                </h3>
                {mission.realisations && mission.realisations.length > 0 ? (
                  <div className="space-y-2">
                    {mission.realisations.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-[#E0F6F7] text-[#004F4F] text-sm">
                            {r.user ? getInitials(r.user.firstname, r.user.lastname) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {r.user ? `${r.user.firstname} ${r.user.lastname}` : "Bénévole"}
                          </p>
                          {r.participatedAt && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateShort(r.participatedAt)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {r.pointsAwarded != null && (
                            <span className="text-xs font-medium text-[#0A9696]">+{r.pointsAwarded} pts</span>
                          )}
                          {r.effectiveDuration && (
                            <p className="text-xs text-gray-400">{r.effectiveDuration}h</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Aucune participation enregistrée pour l&apos;instant.</p>
                )}
              </div>
            )}

            {/* ── Référent ── */}
            {mission.referent && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Référant
                </h3>
                <Badge variant="secondary" className="text-sm py-1 px-3">{mission.referent}</Badge>
              </div>
            )}

            <Separator />

            {/* ══════════════════════════════════════════════════════
                BOUTON RÉCURRENTE : "Déclarer ma participation"
            ══════════════════════════════════════════════════════ */}
            {isRecurring && !isClosed && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-[#0A9696] hover:bg-[#004F4F]">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Déclarer ma participation
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100vw-2rem)] max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Déclarer ma participation</DialogTitle>
                    <DialogDescription className="font-medium text-gray-800">
                      {mission.title}
                      {mission.recurrenceCount && mission.recurrenceUnit && (
                        <span className="ml-2 text-xs font-normal text-[#0A9696]">
                          ({recurrenceLabel(mission.recurrenceCount, mission.recurrenceUnit)})
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-1">
                    {/* Date de participation */}
                    <div className="grid gap-2">
                      <Label htmlFor="participatedAt">
                        Date de participation <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="participatedAt"
                        type="date"
                        value={participatedAt}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setParticipatedAt(e.target.value)}
                      />
                    </div>

                    {/* Durée */}
                    <div className="grid gap-2">
                      <Label htmlFor="effectiveDuration">
                        Durée <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="effectiveDuration"
                          type="number"
                          min="0.5"
                          step="0.5"
                          placeholder="Ex : 1"
                          value={effectiveDuration}
                          onChange={(e) => setEffectiveDuration(e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">heures</span>
                      </div>
                    </div>

                    {/* Points TRIBU */}
                    {mission.points > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Star className="w-4 h-4 text-yellow-600 shrink-0" />
                        <span className="text-sm text-yellow-800">
                          Points TRIBU :{" "}
                          <strong>
                            {effectiveDurationNum > 0 ? `${actualPoints} pts` : "renseignez votre durée"}
                          </strong>
                        </span>
                      </div>
                    )}

                    {/* Commentaire */}
                    <div className="grid gap-2">
                      <Label htmlFor="comment">
                        Commentaire
                        <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Détails de votre participation…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button
                      className="bg-[#0A9696] hover:bg-[#004F4F]"
                      onClick={handleRecurringParticipation}
                    >
                      Valider
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isRecurring && isClosed && (
              <Button variant="outline" disabled className="w-full opacity-50">
                Mission fermée
              </Button>
            )}

            {/* ══════════════════════════════════════════════════════
                BOUTONS MISSION CLASSIQUE
            ══════════════════════════════════════════════════════ */}
            {!isRecurring && (() => {
              const effectivelyRegistered = (userInscrit || isInscrit) && !isDesinscrit;

              return (
                <>
                  {/* Bouton désinscrire */}
                  {!isDatePassed && effectivelyRegistered && !isClosed && (
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-green-50 border-green-200 text-green-700" variant="outline" disabled>
                        Inscrit à la mission
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setIsDesinscritDialogOpen(true)}
                      >
                        Se désinscrire
                      </Button>
                    </div>
                  )}

                  {/* Dialog désinscription */}
                  <Dialog open={isDesinscritDialogOpen} onOpenChange={setIsDesinscritDialogOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle>Se désinscrire</DialogTitle>
                        <DialogDescription>
                          Êtes-vous sûr de vouloir vous désinscrire de la mission{" "}
                          <strong>{mission.title}</strong> ?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDesinscription}>
                          Se désinscrire
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Bouton principal désactivé */}
                  {buttonConfig && buttonConfig.disabled === true && !(!isDatePassed && effectivelyRegistered) && (
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

                  {/* Dialog inscription / validation */}
                  {buttonConfig && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                      <DialogTrigger asChild>
                        {buttonConfig.disabled === false && !(!isDatePassed && effectivelyRegistered) && (
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

                      <DialogContent className="w-[calc(100vw-2rem)] max-w-[520px]">
                        {isDatePassed ? (
                          /* Formulaire validation */
                          <>
                            <DialogHeader>
                              <DialogTitle>Valider ma participation</DialogTitle>
                              <DialogDescription>{mission.title}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-1">
                              <div className="grid gap-2">
                                <Label htmlFor="effectiveDuration">
                                  Durée effective <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="effectiveDuration"
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    placeholder="Ex : 3"
                                    value={effectiveDuration}
                                    onChange={(e) => setEffectiveDuration(e.target.value)}
                                    className="w-32"
                                  />
                                  <span className="text-sm text-gray-500">heures</span>
                                </div>
                                {mission.estimatedHours && (
                                  <p className="text-xs text-gray-400">Durée prévue : {mission.estimatedHours}h</p>
                                )}
                              </div>

                              {mission.points > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <Star className="w-4 h-4 text-yellow-600 shrink-0" />
                                  <span className="text-sm text-yellow-800">
                                    Points TRIBU :{" "}
                                    <strong>
                                      {effectiveDurationNum > 0 ? `${actualPoints} pts` : "renseignez votre durée"}
                                    </strong>
                                  </span>
                                </div>
                              )}

                              <div className="grid gap-2">
                                <Label htmlFor="comment">
                                  Commentaire <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                  id="comment"
                                  placeholder="Décrivez votre participation…"
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Annuler</Button>
                              </DialogClose>
                              <Button className="bg-green-600 hover:bg-green-700" onClick={handleParticipation}>
                                Valider ma participation
                              </Button>
                            </DialogFooter>
                          </>
                        ) : (
                          /* Formulaire inscription */
                          <>
                            <DialogHeader>
                              <DialogTitle>S&apos;inscrire à la mission</DialogTitle>
                              <DialogDescription asChild>
                                <div className="space-y-1 mt-1">
                                  <p className="font-medium text-gray-800">{mission.title}</p>
                                  {mission.date && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(mission.date).toLocaleDateString("fr-FR", {
                                        weekday: "long", day: "numeric", month: "long",
                                      })}
                                    </p>
                                  )}
                                </div>
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-5 py-1">
                              {mission.points > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <Star className="w-4 h-4 text-yellow-600 shrink-0" />
                                  <div className="text-sm text-yellow-800">
                                    <span>Points TRIBU : </span>
                                    <strong>
                                      {mission.estimatedHours && availableDurationNum > 0
                                        ? `${estimatedPoints} pts`
                                        : `${mission.points} pts`}
                                    </strong>
                                    {mission.estimatedHours && (
                                      <span className="text-yellow-600 font-normal">
                                        {availableDurationNum > 0
                                          ? ` (sur ${mission.points} pts max pour ${mission.estimatedHours}h)`
                                          : ` max pour ${mission.estimatedHours}h complètes`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    Mes disponibilités
                                    <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                                  </p>
                                  {!showAvailability ? (
                                    <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowAvailability(true)}>
                                      + Renseigner
                                    </Button>
                                  ) : (
                                    <Button type="button" variant="ghost" size="sm" className="text-xs h-7 text-gray-400" onClick={() => { setShowAvailability(false); setAvailableFrom(""); setAvailableDuration(""); }}>
                                      Annuler
                                    </Button>
                                  )}
                                </div>

                                {showAvailability && (
                                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid gap-1.5">
                                      <Label htmlFor="availableFrom" className="text-xs text-gray-600">Présent à partir de</Label>
                                      <Input id="availableFrom" type="time" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="h-9" />
                                    </div>
                                    <div className="grid gap-1.5">
                                      <Label htmlFor="availableDuration" className="text-xs text-gray-600">Pendant (heures)</Label>
                                      <Input id="availableDuration" type="number" min="0.5" step="0.5" placeholder="Ex : 3" value={availableDuration} onChange={(e) => setAvailableDuration(e.target.value)} className="h-9" />
                                    </div>
                                  </div>
                                )}

                                {!showAvailability && (
                                  <p className="text-xs text-gray-400 italic">Indiquez vos horaires si vous n&apos;êtes disponible qu&apos;une partie de la mission.</p>
                                )}
                              </div>

                              <div className="grid gap-1.5">
                                <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
                                  Commentaire
                                  <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
                                </Label>
                                <Textarea id="comment" placeholder="Une question, une contrainte particulière…" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="resize-none" />
                              </div>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Annuler</Button>
                              </DialogClose>
                              <Button variant="default" onClick={handleInscription}>
                                S&apos;inscrire
                              </Button>
                            </DialogFooter>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              );
            })()}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
