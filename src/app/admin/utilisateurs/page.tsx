"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CheckCircle2,
    XCircle,
    Trash2,
    Shield,
    Search,
    UserCheck,
    UserX,
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
    phone: string;
    role: string;
    validated: boolean;
    points: number;
    pole: { id: string; name: string } | null;
    createdAt: string;
    _count: { inscriptions: number; realisations: number };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

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
            fetchUsers();
        } else {
            const err = await res.json();
            toast.error(err.message ?? "Erreur");
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
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
                                <tr key={user.id} className="hover:bg-gray-50">
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
                                    <td className="px-4 py-3">
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
