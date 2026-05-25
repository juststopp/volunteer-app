"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Users,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Navbar } from "@/components/navbar";
import { MissionDrawer } from "@/components/missions/mission-drawer";
import { Mission } from "@/types/missions";

type ProfileInscription = Mission & {
  myInscription?: {
    availableFrom: string | null;
    availableDuration: number | null;
    comment: string | null;
  };
};

type ProfileRealisation = Mission & {
  pointsAwarded: number | null;
  effectiveDuration: number | null;
  commentaire: string | null;
};

interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  points: number;
  pole: { id: string; name: string } | null;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const ProfileSkeleton = () => (
  <Card>
    <CardHeader className="text-center">
      <div className="flex justify-center mb-4">
        <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-5 h-5" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
      <Separator />
      <div className="grid grid-cols-1 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Skeleton className="w-6 h-6 mx-auto mb-2" />
          <Skeleton className="h-8 w-12 mx-auto mb-2" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const MissionSkeleton = () => (
  <div className="border rounded-lg p-4">
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-3" />
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

const MissionsSkeleton = ({ title, count = 3 }: { title: string; count?: number }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Skeleton className="w-5 h-5" />
        {title}
      </CardTitle>
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <MissionSkeleton key={i} />
        ))}
      </div>
    </CardContent>
  </Card>
);

const getStateColor = (state: string) => {
  if (state === "ACTIVE") return "bg-[#E0F6F7] text-[#004F4F] border-[#69C3D2]";
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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [inscriptions, setInscriptions] = useState<ProfileInscription[]>([]);
  const [completedMissions, setCompletedMissions] = useState<ProfileRealisation[]>([]);
  const [loading, setLoading] = useState(true);

  // Édition du profil
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstname: "", lastname: "", email: "", phone: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      const [userResponse, missionsResponse] = await Promise.all([
        fetch(`/api/user/${userId}`),
        fetch(`/api/user/${userId}/missions`),
      ]);
      if (userResponse.ok) setUserProfile(await userResponse.json());
      if (missionsResponse.ok) {
        const data = await missionsResponse.json();
        setInscriptions(data.inscriptions);
        setCompletedMissions(data.completed);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserData(session.user.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const getInitials = (firstname: string, lastname: string) => {
    return (firstname[0] + lastname[0]).toUpperCase();
  };

  const openEditDialog = () => {
    if (!userProfile) return;
    setEditForm({
      firstname: userProfile.firstname,
      lastname: userProfile.lastname,
      email: userProfile.email,
      phone: userProfile.phone ?? "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    setEditError("");
    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      setEditError("Le prénom et le nom sont requis.");
      return;
    }
    if (!editForm.email.trim()) {
      setEditError("L'email est requis.");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/user/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile((p) => p ? { ...p, ...data } : p);
        setEditOpen(false);
      } else {
        setEditError(data.error ?? "Erreur lors de la mise à jour.");
      }
    } catch {
      setEditError("Erreur réseau.");
    } finally {
      setEditSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <Suspense>
        <Navbar />
      </Suspense>
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {loading || !userProfile ? (
                <ProfileSkeleton />
              ) : (
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="bg-[#E0F6F7] text-[#004F4F] text-2xl">
                          {getInitials(userProfile.firstname, userProfile.lastname)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">
                      {userProfile.firstname} {userProfile.lastname}
                    </CardTitle>
                    <CardDescription>Membre TRIBU</CardDescription>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs text-[#0A9696] border-[#69C3D2] hover:bg-[#E0F6F7]"
                      onClick={openEditDialog}
                    >
                      <Pencil className="w-3 h-3 mr-1.5" /> Modifier mon profil
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {userProfile.firstname} {userProfile.lastname}
                        </p>
                        <p className="text-sm text-gray-500">Nom complet</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{userProfile.email}</p>
                        <p className="text-sm text-gray-500">Email</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{userProfile.phone}</p>
                        <p className="text-sm text-gray-500">Téléphone</p>
                      </div>
                    </div>

                    {userProfile.pole && (
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{userProfile.pole.name}</p>
                          <p className="text-sm text-gray-500">Pôle</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 gap-4 text-center">
                      <div className="p-4 bg-[#E0F6F7] rounded-lg">
                        <Star className="w-6 h-6 text-[#0A9696] mx-auto mb-2" />
                        <p className="text-2xl font-bold text-[#004F4F]">
                          {userProfile.points}
                        </p>
                        <p className="text-sm text-[#0A9696]">Points totaux</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dialog modification du profil */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Modifier mon profil</DialogTitle>
                    <DialogDescription>
                      Mettez à jour vos informations personnelles.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-firstname">Prénom *</Label>
                        <Input
                          id="edit-firstname"
                          value={editForm.firstname}
                          onChange={(e) => setEditForm((f) => ({ ...f, firstname: e.target.value }))}
                          placeholder="Prénom"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-lastname">Nom *</Label>
                        <Input
                          id="edit-lastname"
                          value={editForm.lastname}
                          onChange={(e) => setEditForm((f) => ({ ...f, lastname: e.target.value }))}
                          placeholder="Nom"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="adresse@email.com"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-phone">Téléphone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    {editError && (
                      <p className="text-sm text-red-600">{editError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={editSaving}
                      style={{ backgroundColor: "#0A9696" }}
                      className="hover:opacity-90"
                    >
                      {editSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {loading ? (
                <>
                  <MissionsSkeleton title="Mes inscriptions" />
                  <MissionsSkeleton title="Missions réalisées" />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Mes inscriptions ({inscriptions.length})
                      </CardTitle>
                      <CardDescription>
                        Missions auxquelles vous êtes inscrit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {inscriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Vous n&apos;êtes inscrit à aucune mission</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {inscriptions.map((mission) => {
                            const dispo = mission.myInscription;
                            const otherParticipants = mission.inscriptions?.filter(
                              (i) => i.userId !== session?.user?.id && i.user
                            ) ?? [];
                            return (
                              <MissionDrawer
                                key={mission.id}
                                mission={mission}
                                currentUser={session?.user}
                                onRefresh={() => session?.user?.id && fetchUserData(session.user.id)}
                              >
                                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer space-y-3">
                                  {/* Header */}
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg line-clamp-1">{mission.title}</h3>
                                    <Badge className={getStateColor(mission.state)} variant="outline">
                                      {getStateLabel(mission.state)}
                                    </Badge>
                                  </div>

                                  {/* Description */}
                                  {mission.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2">{mission.description}</p>
                                  )}

                                  {/* Date + points + pôle */}
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{formatDate(mission.date)}</span>
                                    </div>
                                    {mission.points > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5" />
                                        <span>{mission.points} pts max</span>
                                      </div>
                                    )}
                                    {mission.pole && (
                                      <div className="flex items-center gap-1">
                                        <Target className="w-3.5 h-3.5" />
                                        <span>{mission.pole.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Ma disponibilité */}
                                  {(dispo?.availableFrom || dispo?.availableDuration) && (
                                    <div className="flex items-center gap-2 text-xs bg-[#E0F6F7] text-[#004F4F] rounded-md px-3 py-2">
                                      <Clock className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {dispo.availableFrom
                                          ? `À partir de ${new Date(dispo.availableFrom).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                                          : ""}
                                        {dispo.availableFrom && dispo.availableDuration ? " · " : ""}
                                        {dispo.availableDuration ? `pendant ${dispo.availableDuration}h` : ""}
                                      </span>
                                    </div>
                                  )}

                                  {/* Mon commentaire */}
                                  {dispo?.comment && (
                                    <div className="flex items-start gap-2 text-xs text-gray-500 italic">
                                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                      <span>&ldquo;{dispo.comment}&rdquo;</span>
                                    </div>
                                  )}

                                  {/* Autres inscrits */}
                                  {otherParticipants.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Aussi inscrits :
                                      </span>
                                      {otherParticipants.map((i) => (
                                        <span
                                          key={i.id}
                                          className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                                        >
                                          {i.user!.firstname} {i.user!.lastname}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </MissionDrawer>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Missions réalisées ({completedMissions.length})
                      </CardTitle>
                      <CardDescription>
                        Missions que vous avez complétées avec succès
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {completedMissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Vous n&apos;avez encore complété aucune mission</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {completedMissions.map((mission) => (
                            <div
                              key={mission.id}
                              className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3"
                            >
                              {/* Header */}
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg line-clamp-1">{mission.title}</h3>
                                <div className="flex gap-2 shrink-0 ml-2">
                                  <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Réalisé
                                  </Badge>
                                  {(mission.pointsAwarded ?? mission.points) > 0 && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                                      <Star className="w-3 h-3 mr-1" />
                                      +{mission.pointsAwarded ?? mission.points} pts
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {mission.description && (
                                <p className="text-gray-600 text-sm line-clamp-2">{mission.description}</p>
                              )}

                              {/* Date + pôle */}
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{formatDate(mission.date)}</span>
                                </div>
                                {mission.pole && (
                                  <div className="flex items-center gap-1">
                                    <Target className="w-3.5 h-3.5" />
                                    <span>{mission.pole.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Détails de la réalisation */}
                              <div className="bg-white/70 rounded-md px-3 py-2 space-y-1.5 text-sm border border-green-100">
                                {mission.effectiveDuration != null && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>Durée effective : <strong>{mission.effectiveDuration}h</strong></span>
                                  </div>
                                )}
                                {mission.commentaire && (
                                  <div className="flex items-start gap-2 text-gray-600 italic">
                                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <span>&ldquo;{mission.commentaire}&rdquo;</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
