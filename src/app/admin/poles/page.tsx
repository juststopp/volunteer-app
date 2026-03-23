"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Pole {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { missions: number; users: number };
}

const emptyForm = { name: "", description: "" };

export default function AdminPolesPage() {
    const [poles, setPoles] = useState<Pole[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Pole | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Pole | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchPoles = () =>
        fetch("/api/admin/poles")
            .then((r) => r.json())
            .then(setPoles)
            .finally(() => setLoading(false));

    useEffect(() => { fetchPoles(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setFormOpen(true);
    };

    const openEdit = (pole: Pole) => {
        setEditTarget(pole);
        setForm({ name: pole.name, description: pole.description ?? "" });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Le nom est requis");
            return;
        }
        setSaving(true);
        try {
            const url = editTarget ? `/api/admin/poles/${editTarget.id}` : "/api/admin/poles";
            const method = editTarget ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                toast.success(editTarget ? "Pôle modifié" : "Pôle créé");
                setFormOpen(false);
                fetchPoles();
            } else {
                const err = await res.json();
                toast.error(err.message ?? "Erreur");
            }
        } finally {
            setSaving(false);
        }
    };

    const deletePole = async (id: string) => {
        const res = await fetch(`/api/admin/poles/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Pôle supprimé");
            setDeleteTarget(null);
            fetchPoles();
        } else {
            const err = await res.json();
            toast.error(err.message ?? "Erreur lors de la suppression");
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pôles</h1>
                    <p className="text-gray-500 mt-1">{poles.length} pôles configurés</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nouveau pôle
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {poles.map((pole) => (
                        <div
                            key={pole.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{pole.name}</h3>
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEdit(pole)}
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setDeleteTarget(pole)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            {pole.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">{pole.description}</p>
                            )}

                            <div className="flex gap-4 text-sm text-gray-500 mt-auto">
                                <span>{pole._count.missions} mission{pole._count.missions !== 1 ? "s" : ""}</span>
                                <span>{pole._count.users} bénévole{pole._count.users !== 1 ? "s" : ""}</span>
                            </div>
                        </div>
                    ))}

                    {poles.length === 0 && (
                        <div className="col-span-3 text-center py-16 text-gray-500">
                            Aucun pôle créé.{" "}
                            <button onClick={openCreate} className="text-blue-600 underline">
                                Créer le premier pôle →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Dialog formulaire */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Modifier le pôle" : "Nouveau pôle"}</DialogTitle>
                        <DialogDescription>
                            {editTarget ? "Modifiez les informations du pôle." : "Créez un nouveau pôle."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nom *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Nom du pôle"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Description optionnelle"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Enregistrement..." : editTarget ? "Enregistrer" : "Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog confirmation suppression */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le pôle</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le pôle <strong>{deleteTarget?.name}</strong> ?
                            Les missions et bénévoles liés à ce pôle ne seront pas supprimés, mais perdront leur association.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deletePole(deleteTarget.id)}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
