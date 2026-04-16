"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Calendar,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Pole {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  inscribedAt: string;
  comment: string | null;
  completed: boolean;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  pole: Pole | null;
  date: string | null;
  estimatedHours: number | null;
  points: number;
  maxPeople: number | null;
  type: string | null;
  priority: string | null;
  state: string;
  referent: string | null;
  _count: { inscriptions: number; realisations: number };
}

const NONE = "__none__";

const emptyForm = {
  title: "",
  description: "",
  poleId: NONE,
  date: "",
  estimatedHours: "",
  points: "0",
  maxPeople: "",
  type: NONE,
  priority: NONE,
  state: "ACTIVE",
  referent: "",
};

const STATE_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  CLOSED: "Fermée",
  DONE: "Terminée",
};
const STATE_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
  CLOSED: "bg-orange-100 text-orange-800 border-orange-200",
  DONE: "bg-green-100 text-green-800 border-green-200",
};

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filtered, setFiltered] = useState<Mission[]>([]);
  const [poles, setPoles] = useState<Pole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [participantsMission, setParticipantsMission] =
    useState<Mission | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const fetchMissions = () =>
    fetch("/api/admin/missions")
      .then((r) => r.json())
      .then((data) => {
        setMissions(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchMissions();
    fetch("/api/poles")
      .then((r) => r.json())
      .then(setPoles);
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(missions.filter((m) => m.title.toLowerCase().includes(q)));
  }, [search, missions]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (mission: Mission) => {
    setEditTarget(mission);
    setForm({
      title: mission.title,
      description: mission.description ?? "",
      poleId: mission.pole?.id ?? NONE,
      date: mission.date ? mission.date.slice(0, 10) : "",
      estimatedHours: mission.estimatedHours?.toString() ?? "",
      points: mission.points.toString(),
      maxPeople: mission.maxPeople?.toString() ?? "",
      type: mission.type ?? NONE,
      priority: mission.priority ?? NONE,
      state: mission.state,
      referent: mission.referent ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      const url = editTarget
        ? `/api/admin/missions/${editTarget.id}`
        : "/api/admin/missions";
      const method = editTarget ? "PATCH" : "POST";

      const payload = {
        ...form,
        poleId: form.poleId === NONE ? "" : form.poleId,
        type: form.type === NONE ? "" : form.type,
        priority: form.priority === NONE ? "" : form.priority,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editTarget ? "Mission modifiée" : "Mission créée");
        setFormOpen(false);
        fetchMissions();
      } else {
        const err = await res.json();
        toast.error(err.message ?? "Erreur");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteMission = async (id: string) => {
    const res = await fetch(`/api/admin/missions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Mission supprimée");
      setDeleteTarget(null);
      fetchMissions();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const setField = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openParticipants = async (mission: Mission) => {
    setParticipantsMission(mission);
    setParticipantsLoading(true);
    setParticipants([]);
    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/participants`);
      const data = await res.json();
      setParticipants(data);
    } finally {
      setParticipantsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-500 mt-1">
            {missions.length} missions au total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nouvelle mission
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher une mission..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Mission
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Pôle
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                  Participants
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  État
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {mission.title}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {mission.points} pts
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                    {mission.pole?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                    {mission.date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(mission.date).toLocaleDateString("fr-FR")}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-3 h-3" />
                      {mission._count.inscriptions}/{mission.maxPeople ?? "∞"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={STATE_COLORS[mission.state]}
                      variant="outline"
                    >
                      {STATE_LABELS[mission.state]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => openParticipants(mission)}
                        title="Voir les participants"
                      >
                        <Users className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => openEdit(mission)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(mission)}
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
            <div className="text-center py-12 text-gray-500">
              Aucune mission trouvée
            </div>
          )}
        </div>
      )}

      {/* Dialog formulaire création/édition */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Modifier la mission" : "Nouvelle mission"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Modifiez les informations de la mission."
                : "Remplissez les informations de la nouvelle mission."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Titre *</Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Titre de la mission"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Description (markdown supporté)"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pôle</Label>
                <Select
                  value={form.poleId}
                  onValueChange={(v) => setField("poleId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun</SelectItem>
                    {poles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>État</Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setField("state", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Fermée</SelectItem>
                    <SelectItem value="DONE">Terminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Durée estimée (heures)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(e) => setField("estimatedHours", e.target.value)}
                  placeholder="Ex: 2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Points TRIBU</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.points}
                  onChange={(e) => setField("points", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Nombre max de participants</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxPeople}
                  onChange={(e) => setField("maxPeople", e.target.value)}
                  placeholder="Illimité si vide"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun</SelectItem>
                    <SelectItem value="Ponctuelle">Ponctuelle</SelectItem>
                    <SelectItem value="Récurrente">Récurrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Priorité</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setField("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Référant</Label>
              <Input
                value={form.referent}
                onChange={(e) => setField("referent", e.target.value)}
                placeholder="Nom du référant"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Enregistrement..."
                : editTarget
                  ? "Enregistrer"
                  : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog participants */}
      <Dialog
        open={!!participantsMission}
        onOpenChange={() => setParticipantsMission(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants — {participantsMission?.title}
            </DialogTitle>
            <DialogDescription>
              {participantsMission?._count.inscriptions} inscription(s) sur{" "}
              {participantsMission?.maxPeople ?? "∞"} places
            </DialogDescription>
          </DialogHeader>

          {participantsLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun participant inscrit
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      Nom
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      Téléphone
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      Commentaire
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">
                      Inscrit le
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {p.firstname} {p.lastname}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{p.email}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {p.phone ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {p.comment ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">
                        {new Date(p.inscribedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2">
                        {p.completed ? (
                          <Badge
                            className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit"
                            variant="outline"
                          >
                            <UserCheck className="w-3 h-3" /> Réalisé
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-blue-100 text-blue-800 border-blue-200 w-fit"
                            variant="outline"
                          >
                            Inscrit
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setParticipantsMission(null)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la mission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{deleteTarget?.title}</strong> ? Toutes les inscriptions
              et réalisations associées seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMission(deleteTarget.id)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
