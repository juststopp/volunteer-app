"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CheckCircle2,
    XCircle,
    Trash2,
    Shield,
    Search,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Star,
    Calendar,
    Users,
    UserMinus,
    UserPlus,
    Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface User {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    role: string;
    validated: boolean;
    points: number;
    pole: { id: string; name: string } | null;
    createdAt: string;
    _count: { inscriptions: number; realisations: number };
}

interface UserMission {
    id: string;
    title: string;
    date: string | null;
    points: number;
    estimatedHours: number | null;
    state: string;
    pole: { id: string; name: string } | null;
    inscribedAt: string;
    availableFrom: string | null;
    availableDuration: number | null;
    completed: boolean;
    effectiveDuration: number | null;
    pointsAwarded: number | null;
}

interface AllMission {
    id: string;
    title: string;
    state: string;
    date: string | null;
    pole: { id: string; name: string } | null;
}

const STATE_LABELS: Record<string, string> = {
    ACTIVE: "Active",
    CLOSED: "Fermée",
    DONE: "Terminée",
};
const STATE_COLORS: Record<string, string> = {
    ACTIVE: "bg-[#E0F6F7] text-[#004F4F] border-[#69C3D2]",
    CLOSED: "bg-orange-100 text-orange-800 border-orange-200",
    DONE: "bg-green-100 text-green-800 border-green-200",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    // Fiche utilisateur
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userMissions, setUserMissions] = useState<UserMission[]>([]);
    const [missionsLoading, setMissionsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Ajout d'une mission
    const [allMissions, setAllMissions] = useState<AllMission[]>([]);
    const [addMissionSearch, setAddMissionSearch] = useState("");
    const [addMissionLoading, setAddMissionLoading] = useState(false);

    // Dialog validation points
    const [validateDialog, setValidateDialog] = useState<{
        mission: UserMission;
        customPoints: number;
        isEdit: boolean;
    } | null>(null);

    const fetchUsers = () => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => {
                setUsers(data);
                setFiltered(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
        fetch("/api/admin/missions")
            .then((r) => r.json())
            .then(setAllMissions);
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            users.filter(
                (u) =>
                    u.firstname.toLowerCase().includes(q) ||
                    u.lastname.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
            )
        );
    }, [search, users]);

    const patch = async (id: string, data: Record<string, unknown>, successMsg: string) => {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            toast.success(successMsg);
            fetchUsers();
            // Mettre à jour selectedUser si c'est lui qui est modifié
            if (selectedUser?.id === id) {
                setSelectedUser((u) => u ? { ...u, ...data } as User : null);
            }
        } else {
            const err = await res.json();
            toast.error(err.message ?? "Erreur");
        }
    };

    const deleteUser = async (id: string) => {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Utilisateur supprimé");
            setDeleteTarget(null);
            if (selectedUser?.id === id) setSelectedUser(null);
            fetchUsers();
        } else {
            const err = await res.json();
            toast.error(err.message ?? "Erreur");
        }
    };

    const fetchUserMissions = async (userId: string) => {
        setMissionsLoading(true);
        setUserMissions([]);
        try {
            const res = await fetch(`/api/admin/users/${userId}/missions`);
            const data = await res.json();
            setUserMissions(data);
        } finally {
            setMissionsLoading(false);
        }
    };

    const openUserSheet = async (user: User) => {
        setSelectedUser(user);
        setAddMissionSearch("");
        await fetchUserMissions(user.id);
    };

    // Ouvrir la dialog de validation / modification des points
    const openValidateDialog = (mission: UserMission) => {
        setValidateDialog({
            mission,
            customPoints: mission.completed
                ? (mission.pointsAwarded ?? mission.points)
                : mission.points,
            isEdit: mission.completed,
        });
    };

    // Confirmer la validation ou la modification des points
    const confirmValidation = async () => {
        if (!selectedUser || !validateDialog) return;
        const { mission, customPoints } = validateDialog;
        setValidateDialog(null);
        setActionLoading(mission.id + "-status");
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/missions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, completed: true, pointsAwarded: customPoints }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                await fetchUserMissions(selectedUser.id);
                fetchUsers();
                setSelectedUser((u) => u ? { ...u, points: u.points + (mission.completed ? customPoints - (mission.pointsAwarded ?? mission.points) : customPoints) } : null);
            } else {
                toast.error(data.message ?? "Erreur");
            }
        } finally {
            setActionLoading(null);
        }
    };

    // Annuler une réalisation
    const cancelValidation = async (mission: UserMission) => {
        if (!selectedUser) return;
        setActionLoading(mission.id + "-status");
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/missions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, completed: false }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                await fetchUserMissions(selectedUser.id);
                fetchUsers();
                setSelectedUser((u) => u ? { ...u, points: u.points - (mission.pointsAwarded ?? mission.points) } : null);
            } else {
                toast.error(data.message ?? "Erreur");
            }
        } finally {
            setActionLoading(null);
        }
    };

    // Retirer l'utilisateur d'une mission
    const removeMission = async (mission: UserMission) => {
        if (!selectedUser) return;
        setActionLoading(mission.id + "-remove");
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/missions`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                await fetchUserMissions(selectedUser.id);
                fetchUsers();
                if (mission.completed) {
                    setSelectedUser((u) =>
                        u ? { ...u, points: u.points - mission.points } : null
                    );
                }
            } else {
                toast.error(data.message ?? "Erreur");
            }
        } finally {
            setActionLoading(null);
        }
    };

    // Inscrire l'utilisateur à une mission
    const addMission = async (missionId: string) => {
        if (!selectedUser) return;
        setAddMissionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/missions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setAddMissionSearch("");
                await fetchUserMissions(selectedUser.id);
                fetchUsers();
            } else {
                toast.error(data.message ?? "Erreur");
            }
        } finally {
            setAddMissionLoading(false);
        }
    };

    // Missions disponibles pour cet utilisateur (non déjà inscrit)
    const enrolledMissionIds = new Set(userMissions.map((m) => m.id));
    const availableMissions = allMissions.filter(
        (m) =>
            !enrolledMissionIds.has(m.id) &&
            (addMissionSearch.trim() === "" ||
                m.title.toLowerCase().includes(addMissionSearch.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
                    <p className="text-gray-500 mt-1">{users.length} bénévoles enregistrés</p>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Bénévole</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Pôle</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Missions</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Points</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openUserSheet(user)}
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {user.firstname} {user.lastname}
                                            </p>
                                            <p className="text-gray-500 text-xs">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="text-gray-600">{user.pole?.name ?? "—"}</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <span className="text-gray-600">
                                            {user._count.inscriptions} inscrits / {user._count.realisations} réalisées
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <span className="font-medium">{user.points} pts</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            {user.validated ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-200 w-fit" variant="outline">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Validé
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 w-fit" variant="outline">
                                                    <XCircle className="w-3 h-3 mr-1" /> En attente
                                                </Badge>
                                            )}
                                            {user.role === "ADMIN" && (
                                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 w-fit" variant="outline">
                                                    <Shield className="w-3 h-3 mr-1" /> Admin
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {user.validated ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => patch(user.id, { validated: false }, "Compte suspendu")}
                                                >
                                                    <UserX className="w-3 h-3 mr-1" /> Suspendre
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                    onClick={() => patch(user.id, { validated: true }, "Compte validé")}
                                                >
                                                    <UserCheck className="w-3 h-3 mr-1" /> Valider
                                                </Button>
                                            )}
                                            {user.role === "ADMIN" ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => patch(user.id, { role: "USER" }, "Droits admin retirés")}
                                                >
                                                    <Shield className="w-3 h-3 mr-1" /> Retirer admin
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => patch(user.id, { role: "ADMIN" }, "Promu administrateur")}
                                                >
                                                    <Shield className="w-3 h-3 mr-1" /> Promouvoir
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => setDeleteTarget(user)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-500">Aucun utilisateur trouvé</div>
                    )}
                </div>
            )}

            {/* ── Fiche utilisateur (popup) ── */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {selectedUser.firstname} {selectedUser.lastname}
                                </DialogTitle>
                                <DialogDescription asChild>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedUser.validated ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Validé
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                                                <XCircle className="w-3 h-3 mr-1" /> En attente
                                            </Badge>
                                        )}
                                        {selectedUser.role === "ADMIN" && (
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200" variant="outline">
                                                <Shield className="w-3 h-3 mr-1" /> Admin
                                            </Badge>
                                        )}
                                    </div>
                                </DialogDescription>
                            </DialogHeader>

                            {/* Infos de l'utilisateur */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="truncate">{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{selectedUser.phone ?? "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>Pôle : {selectedUser.pole?.name ?? "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Star className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="font-semibold">{selectedUser.points} points TRIBU</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <UserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>
                                        {selectedUser._count.realisations} mission{selectedUser._count.realisations !== 1 ? "s" : ""} réalisée{selectedUser._count.realisations !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="flex flex-wrap gap-2">
                                {selectedUser.validated ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => patch(selectedUser.id, { validated: false }, "Compte suspendu")}
                                    >
                                        <UserX className="w-3 h-3 mr-1" /> Suspendre le compte
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                        onClick={() => patch(selectedUser.id, { validated: true }, "Compte validé")}
                                    >
                                        <UserCheck className="w-3 h-3 mr-1" /> Valider le compte
                                    </Button>
                                )}
                                {selectedUser.role === "ADMIN" ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => patch(selectedUser.id, { role: "USER" }, "Droits admin retirés")}
                                    >
                                        <Shield className="w-3 h-3 mr-1" /> Retirer les droits admin
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => patch(selectedUser.id, { role: "ADMIN" }, "Promu administrateur")}
                                    >
                                        <Shield className="w-3 h-3 mr-1" /> Promouvoir admin
                                    </Button>
                                )}
                            </div>

                            <hr className="border-gray-200" />

                            {/* Section missions */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Missions
                                    <span className="text-gray-400 font-normal text-sm">
                                        ({userMissions.length} inscription{userMissions.length !== 1 ? "s" : ""})
                                    </span>
                                </h3>

                                {/* Ajout d'une mission */}
                                <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 mb-4">
                                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                        <UserPlus className="w-3.5 h-3.5" /> Inscrire à une mission
                                    </p>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <Input
                                            placeholder="Rechercher une mission..."
                                            value={addMissionSearch}
                                            onChange={(e) => setAddMissionSearch(e.target.value)}
                                            className="pl-8 h-8 text-sm"
                                        />
                                    </div>
                                    {addMissionSearch.trim() !== "" && (
                                        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
                                            {availableMissions.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-3">
                                                    Aucune mission disponible
                                                </p>
                                            ) : (
                                                availableMissions.slice(0, 10).map((m) => (
                                                    <button
                                                        key={m.id}
                                                        disabled={addMissionLoading}
                                                        onClick={() => addMission(m.id)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#E0F6F7] flex items-center justify-between group transition-colors"
                                                    >
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <span className="font-medium text-gray-900 truncate">{m.title}</span>
                                                            <Badge
                                                                className={`${STATE_COLORS[m.state]} text-xs shrink-0`}
                                                                variant="outline"
                                                            >
                                                                {STATE_LABELS[m.state]}
                                                            </Badge>
                                                        </span>
                                                        <span className="text-[#0A9696] text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                                            Inscrire →
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Liste des missions */}
                                {missionsLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : userMissions.length === 0 ? (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                        Aucune mission inscrite
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                                        <table className="w-full min-w-[480px] text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Mission</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Statut</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {userMissions.map((m) => (
                                                    <tr key={m.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            <p className="font-medium text-gray-900">{m.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {m.points} pts max
                                                                {m.estimatedHours ? ` · ${m.estimatedHours}h` : ""}
                                                                {m.pole ? ` · ${m.pole.name}` : ""}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">
                                                            <p>{m.date ? new Date(m.date).toLocaleDateString("fr-FR") : "—"}</p>
                                                            {m.availableFrom && (
                                                                <p className="text-xs text-gray-400">
                                                                    Dispo. {new Date(m.availableFrom).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                                                    {m.availableDuration ? ` · ${m.availableDuration}h` : ""}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {m.completed ? (
                                                                <div>
                                                                    <Badge
                                                                        className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit"
                                                                        variant="outline"
                                                                    >
                                                                        <UserCheck className="w-3 h-3" /> Réalisé
                                                                    </Badge>
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        {m.effectiveDuration != null ? `${m.effectiveDuration}h · ` : ""}
                                                                        <span className="font-medium text-yellow-700">
                                                                            {m.pointsAwarded ?? 0} pts
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <Badge
                                                                    className="bg-[#E0F6F7] text-[#004F4F] border-[#69C3D2] w-fit"
                                                                    variant="outline"
                                                                >
                                                                    Inscrit
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-1.5">
                                                                {m.completed ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={actionLoading === m.id + "-status" || actionLoading === m.id + "-remove"}
                                                                            onClick={() => openValidateDialog(m)}
                                                                            title="Modifier les points"
                                                                            className="text-xs text-[#0A9696] border-[#69C3D2] hover:bg-[#E0F6F7]"
                                                                        >
                                                                            {actionLoading === m.id + "-status" ? (
                                                                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                                                            ) : (
                                                                                <Pencil className="w-3 h-3" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={actionLoading === m.id + "-status" || actionLoading === m.id + "-remove"}
                                                                            onClick={() => cancelValidation(m)}
                                                                            title="Annuler la réalisation"
                                                                            className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                                                        >
                                                                            <XCircle className="w-3 h-3" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={actionLoading === m.id + "-status" || actionLoading === m.id + "-remove"}
                                                                        onClick={() => openValidateDialog(m)}
                                                                        title="Valider la participation"
                                                                        className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                                                                    >
                                                                        {actionLoading === m.id + "-status" ? (
                                                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                                                        ) : (
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={actionLoading === m.id + "-remove" || actionLoading === m.id + "-status"}
                                                                    onClick={() => removeMission(m)}
                                                                    title="Retirer de la mission"
                                                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                                >
                                                                    {actionLoading === m.id + "-remove" ? (
                                                                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                                                    ) : (
                                                                        <UserMinus className="w-3 h-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => {
                                        setDeleteTarget(selectedUser);
                                        setSelectedUser(null);
                                    }}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> Supprimer le compte
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                    Fermer
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog validation / modification des points */}
            <Dialog open={!!validateDialog} onOpenChange={() => setValidateDialog(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {validateDialog?.isEdit ? "Modifier les points" : "Valider la participation"}
                        </DialogTitle>
                        <DialogDescription>
                            {validateDialog?.mission.title}
                            {validateDialog?.isEdit && (
                                <span className="block text-xs mt-1">
                                    Points actuels : {validateDialog.mission.pointsAwarded ?? 0} pts
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <Label htmlFor="customPointsUser">Points TRIBU à attribuer</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="customPointsUser"
                                type="number"
                                min="0"
                                value={validateDialog?.customPoints ?? 0}
                                onChange={(e) =>
                                    setValidateDialog((d) =>
                                        d ? { ...d, customPoints: parseInt(e.target.value) || 0 } : null
                                    )
                                }
                                className="w-32"
                            />
                            <span className="text-sm text-gray-500">pts</span>
                            {validateDialog && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-gray-400"
                                    onClick={() =>
                                        setValidateDialog((d) =>
                                            d ? { ...d, customPoints: d.mission.points } : null
                                        )
                                    }
                                >
                                    Max ({validateDialog.mission.points})
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setValidateDialog(null)}>
                            Annuler
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={confirmValidation}>
                            {validateDialog?.isEdit ? "Enregistrer" : "Valider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog confirmation suppression */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer{" "}
                            <strong>
                                {deleteTarget?.firstname} {deleteTarget?.lastname}
                            </strong>{" "}
                            ? Cette action est irréversible et supprimera toutes ses
                            inscriptions et réalisations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteUser(deleteTarget.id)}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
