"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Award,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { MissionDrawer } from "@/components/missions/mission-drawer";

interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  fullName: string;
  email: string;
  phone: string;
  points?: number;
}

interface Mission {
  id: string;
  mission: string;
  description: string;
  pole: string[];
  dateMission: string;
  pointsTribu: number;
  etat: string;
  priorite: string;
  typeMission: string;
  usersInscrits: Array<{ id: string; name: string }>;
  usersCompleted: string[];
  nombreInscrits: number;
  nombrePersonnes: number;
  dureeEstimee?: number;
  referant?: string[];
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

const MissionsSkeleton = ({
  title,
  count = 3,
}: {
  title: string;
  count?: number;
}) => (
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [inscriptions, setInscriptions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.airtableId) {
        try {
          setLoading(true);

          const userResponse = await fetch(
            `/api/user/${session.user.airtableId}`
          );
          if (!userResponse.ok)
            throw new Error("Erreur lors du chargement du profil");
          const userData = await userResponse.json();
          setUserProfile(userData);

          const missionsResponse = await fetch(
            `/api/user/${session.user.airtableId}/missions`
          );
          if (!missionsResponse.ok)
            throw new Error("Erreur lors du chargement des missions");
          const missionsData = await missionsResponse.json();

          setInscriptions(missionsData.inscriptions);
          setCompletedMissions(missionsData.completed);
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données utilisateur:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    };

    if (status === "authenticated") {
      fetchUserData();
    }
  }, [session, status]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getEtatColor = (etat: string) => {
    if (etat?.includes("Recherche"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (etat?.includes("En cours"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (etat?.includes("Terminé"))
      return "bg-green-100 text-green-800 border-green-200";
    if (etat?.includes("Annulé"))
      return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPrioriteColor = (priorite: string) => {
    if (priorite?.includes("🔴")) return "bg-red-500 text-white";
    if (priorite?.includes("🟠")) return "bg-orange-500 text-white";
    if (priorite?.includes("🟡")) return "bg-yellow-500 text-white";
    if (priorite?.includes("🟢")) return "bg-green-500 text-white";
    return "bg-gray-500 text-white";
  };

  const totalPointsEarned = completedMissions.reduce(
    (total, mission) => total + (mission.pointsTribu || 0),
    0
  );

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
      <Navbar />
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
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                          {getInitials(userProfile.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">
                      {userProfile.fullName}
                    </CardTitle>
                    <CardDescription>Membre TRIBU</CardDescription>
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

                    <Separator />

                    <div className="grid grid-cols-1 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-700">
                          {userProfile.points || 0}
                        </p>
                        <p className="text-sm text-blue-600">Points totaux</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                          <p>Vous n'êtes inscrit à aucune mission</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {inscriptions.map((mission) => (
                            <MissionDrawer
                              key={mission.id}
                              mission={mission}
                              currentUser={session?.user}
                            >
                              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-semibold text-lg line-clamp-1">
                                    {mission.mission}
                                  </h3>
                                  <div className="lg:flex hidden gap-2">
                                    <Badge
                                      className={getEtatColor(mission.etat)}
                                      variant="outline"
                                    >
                                      {mission.etat
                                        ?.replace(/📝|🔄|✅|❌/g, "")
                                        .trim()}
                                    </Badge>
                                    {mission.priorite && (
                                      <Badge
                                        className={getPrioriteColor(
                                          mission.priorite
                                        )}
                                      >
                                        {mission.priorite
                                          .replace(/🔴|🟠|🟡|🟢/g, "")
                                          .trim()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {mission.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>
                                        {formatDate(mission.dateMission)}
                                      </span>
                                    </div>
                                    {mission.pointsTribu && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4" />
                                        <span>{mission.pointsTribu} pts</span>
                                      </div>
                                    )}
                                  </div>

                                  {mission.pole && mission.pole.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      <span>
                                        {mission.pole.slice(0, 2).join(", ")}
                                      </span>
                                      {mission.pole.length > 2 && (
                                        <span>+{mission.pole.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </MissionDrawer>
                          ))}
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
                          <p>Vous n'avez encore complété aucune mission</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {completedMissions.map((mission) => (
                            <MissionDrawer
                              key={mission.id}
                              mission={mission}
                              currentUser={session?.user}
                            >
                              <div className="border rounded-lg p-4 bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-semibold text-lg line-clamp-1">
                                    {mission.mission}
                                  </h3>
                                  <div className="flex gap-2">
                                    <Badge
                                      className="bg-green-100 text-green-800 border-green-200"
                                      variant="outline"
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Terminé
                                    </Badge>
                                    {mission.pointsTribu && (
                                      <Badge
                                        className="bg-yellow-100 text-yellow-800 border-yellow-200"
                                        variant="outline"
                                      >
                                        <Star className="w-3 h-3 mr-1" />+
                                        {mission.pointsTribu} pts
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {mission.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>
                                        {formatDate(mission.dateMission)}
                                      </span>
                                    </div>
                                  </div>

                                  {mission.pole && mission.pole.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      <span>
                                        {mission.pole.slice(0, 2).join(", ")}
                                      </span>
                                      {mission.pole.length > 2 && (
                                        <span>+{mission.pole.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </MissionDrawer>
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
