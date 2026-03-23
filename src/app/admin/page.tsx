"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, CheckCircle2, Clock, MapPin, Star } from "lucide-react";
import Link from "next/link";

interface Stats {
    totalUsers: number;
    pendingUsers: number;
    totalMissions: number;
    activeMissions: number;
    totalInscriptions: number;
    totalRealisations: number;
    totalPoles: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then(setStats);
    }, []);

    const statCards = stats
        ? [
              {
                  label: "Bénévoles",
                  value: stats.totalUsers,
                  sub: `${stats.pendingUsers} en attente de validation`,
                  icon: Users,
                  href: "/admin/utilisateurs",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
              },
              {
                  label: "Missions",
                  value: stats.totalMissions,
                  sub: `${stats.activeMissions} actives`,
                  icon: Target,
                  href: "/admin/missions",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
              },
              {
                  label: "Inscriptions",
                  value: stats.totalInscriptions,
                  sub: "total toutes missions",
                  icon: Clock,
                  href: "/admin/missions",
                  color: "text-orange-600",
                  bg: "bg-orange-50",
              },
              {
                  label: "Réalisations",
                  value: stats.totalRealisations,
                  sub: "missions complétées",
                  icon: CheckCircle2,
                  href: "/admin/missions",
                  color: "text-green-600",
                  bg: "bg-green-50",
              },
              {
                  label: "Pôles",
                  value: stats.totalPoles,
                  sub: "catégories",
                  icon: MapPin,
                  href: "/admin/poles",
                  color: "text-pink-600",
                  bg: "bg-pink-50",
              },
          ]
        : [];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Vue d&apos;ensemble de l&apos;application</p>
            </div>

            {!stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {statCards.map((card) => (
                        <Link key={card.label} href={card.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        {card.label}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${card.bg}`}>
                                        <card.icon className={`w-5 h-5 ${card.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {stats && stats.pendingUsers > 0 && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-yellow-800">
                            {stats.pendingUsers} compte{stats.pendingUsers > 1 ? "s" : ""} en attente de validation
                        </p>
                        <p className="text-sm text-yellow-700">
                            <Link href="/admin/utilisateurs" className="underline">
                                Valider les comptes →
                            </Link>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
