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
  UserMinus,
  UserPlus,
  CheckCircle2,
  XCircle,
  RefreshCw,
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
  availableFrom: string | null;
  availableDuration: number | null;
  completed: boolean;
  realisationId: string | null;
  effectiveDuration: number | null;
  pointsAwarded: number | null;
}

interface RecurringParticipation {
  id: string;
  participatedAt: string | null;
  effectiveDuration: number | null;
  pointsAwarded: number | null;
  commentaire: string | null;
  createdAt: string;
  user: { id: string; firstname: string; lastname: string; email: string; phone: string | null };
}

interface AllUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
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
  recurrenceCount: number | null;
  recurrenceUnit: string | null;
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
  recurrenceCount: "",
  recurrenceUnit: NONE,
};

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

const RECURRENCE_UNITS = [
  { value: "jour", label: "jour(s)" },
  { value: "semaine", label: "semaine(s)" },
  { value: "mois", label: "mois" },
];

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

  // Participants dialog
  const [participantsMission, setParticipantsMission] = useState<Mission | null>(null);
  const [isRecurringMode, setIsRecurringMode] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [recurringParticipations, setRecurringParticipations] = useState<RecurringParticipation[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog validation points
  const [validateDialog, setValidateDialog] = useState<{
    participant: Participant;
    customPoints: number;
    isEdit: boolean;
  } | null>(null);

  // Add volunteer
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [addLoading, setAddLoading] = useState(false);

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
    fetch("/api/poles").then((r) => r.json()).then(setPoles);
    fetch("/api/admin/users").then((r) => r.json()).then(setAllUsers);
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
      recurrenceCount: mission.recurrenceCount?.toString() ?? "",
      recurrenceUnit: mission.recurrenceUnit ?? NONE,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/admin/missions/${editTarget.id}` : "/api/admin/missions";
      const method = editTarget ? "PATCH" : "POST";
      const payload = {
        ...form,
        poleId: form.poleId === NONE ? "" : form.poleId,
        type: form.type === NONE ? "" : form.type,
        priority: form.priority === NONE ? "" : form.priority,
        recurrenceUnit: form.recurrenceUnit === NONE ? "" : form.recurrenceUnit,
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

  const fetchParticipants = async (missionId: string) => {
    setParticipantsLoading(true);
    setParticipants([]);
    setRecurringParticipations([]);
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/participants`);
      const data = await res.json();
      if (data.isRecurring) {
        setIsRecurringMode(true);
        setRecurringParticipations(data.realisations ?? []);
      } else {
        setIsRecurringMode(false);
        setParticipants(data.participants ?? []);
      }
    } finally {
      setParticipantsLoading(false);
    }
  };

  const openParticipants = async (mission: Mission) => {
    setParticipantsMission(mission);
    setAddSearch("");
    await fetchParticipants(mission.id);
  };

  const openValidateDialog = (participant: Participant) => {
    if (!participantsMission) return;
    setValidateDialog({
      participant,
      customPoints: participant.completed
        ? (participant.pointsAwarded ?? participantsMission.points)
        : participantsMission.points,
      isEdit: participant.completed,
    });
  };

  const confirmValidation = async () => {
    if (!participantsMission || !validateDialog) return;
    const { participant, customPoints } = validateDialog;
    setValidateDialog(null);
    setActionLoading(participant.id + "-status");
    try {
      const res = await fetch(`/api/admin/missions/${participantsMission.id}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participant.id, completed: true, pointsAwarded: customPoints }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchParticipants(participantsMission.id);
        fetchMissions();
      } else {
        toast.error(data.message ?? "Erreur");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const cancelValidation = async (participant: Participant) => {
    if (!participantsMission) return;
    setActionLoading(participant.id + "-status");
    try {
      const res = await fetch(`/api/admin/missions/${participantsMission.id}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participant.id, completed: false }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchParticipants(participantsMission.id);
        fetchMissions();
      } else {
        toast.error(data.message ?? "Erreur");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const removeParticipant = async (participant: Participant) => {
    if (!participantsMission) return;
    setActionLoading(participant.id + "-remove");
    try {
      const res = await fetch(`/api/admin/missions/${participantsMission.id}/participants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participant.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchParticipants(participantsMission.id);
        fetchMissions();
      } else {
        toast.error(data.message ?? "Erreur");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const removeRecurringParticipation = async (realisationId: string) => {
    if (!participantsMission) return;
    setActionLoading(realisationId + "-remove");
    try {
      const res = await fetch(`/api/admin/missions/${participantsMission.id}/participants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realisationId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchParticipants(participantsMission.id);
        fetchMissions();
      } else {
        toast.error(data.message ?? "Erreur");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const addParticipant = async (userId: string) => {
    if (!participantsMission) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/admin/missions/${participantsMission.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setAddSearch("");
        await fetchParticipants(participantsMission.id);
        fetchMissions();
      } else {
        toast.error(data.message ?? "Erreur");
      }
    } finally {
      setAddLoading(false);
    }
  };

  const enrolledIds = new Set(participants.map((p) => p.id));
  const availableUsers = allUsers.filter(
    (u) =>
      !enrolledIds.has(u.id) &&
      (addSearch.trim() === "" ||
        `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase().includes(addSearch.toLowerCase()))
  );

  const isRecurringForm = form.type === "Récurrente";

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-500 mt-1">{missions.length} missions au total</p>
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
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mission</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Pôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date / Récurrence</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Participants</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">État</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((mission) => (
                <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openParticipants(mission)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {mission.type === "Récurrente" && (
                        <RefreshCw className="w-3.5 h-3.5 text-[#0A9696] shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{mission.title}</p>
                        <p className="text-gray-500 text-xs">
                          {mission.points} pts max
                          {mission.estimatedHours ? ` · ${mission.estimatedHours}h` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                    {mission.pole?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                    {mission.type === "Récurrente" ? (
                      mission.recurrenceCount && mission.recurrenceUnit ? (
                        <span className="text-[#0A9696] text-xs font-medium">
                          {mission.recurrenceCount}× / {mission.recurrenceUnit}
                        </span>
                      ) : (
                        <span className="text-[#0A9696] text-xs">Récurrente</span>
                      )
                    ) : mission.date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(mission.date).toLocaleDateString("fr-FR")}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-gray-600">
                      {mission.type === "Récurrente" ? (
                        <><CheckCircle2 className="w-3 h-3" /> {mission._count.realisations} participation{mission._count.realisations !== 1 ? "s" : ""}</>
                      ) : (
                        <><Users className="w-3 h-3" /> {mission._count.inscriptions}/{mission.maxPeople ?? "∞"}</>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATE_COLORS[mission.state]} variant="outline">
                      {STATE_LABELS[mission.state]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => openEdit(mission)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(mission)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">Aucune mission trouvée</div>
          )}
        </div>
      )}

      {/* ══════════ Dialog formulaire création/édition ══════════ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Modifier la mission" : "Nouvelle mission"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Modifiez les informations de la mission." : "Remplissez les informations de la nouvelle mission."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Titre de la mission" />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Description (markdown supporté)" rows={4} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pôle</Label>
                <Select value={form.poleId} onValueChange={(v) => setField("poleId", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun</SelectItem>
                    {poles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>État</Label>
                <Select value={form.state} onValueChange={(v) => setField("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Fermée</SelectItem>
                    <SelectItem value="DONE">Terminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun</SelectItem>
                    <SelectItem value="Ponctuelle">Ponctuelle</SelectItem>
                    <SelectItem value="Récurrente">Récurrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setField("priority", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Champs récurrence (uniquement si type = Récurrente) ── */}
            {isRecurringForm && (
              <div className="p-3 bg-[#E0F6F7] rounded-lg border border-[#69C3D2] space-y-3">
                <p className="text-sm font-medium text-[#004F4F] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Récurrence
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#004F4F]">Fréquence</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex : 1"
                      value={form.recurrenceCount}
                      onChange={(e) => setField("recurrenceCount", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-[#004F4F]">Unité</Label>
                    <Select value={form.recurrenceUnit} onValueChange={(v) => setField("recurrenceUnit", v)}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {RECURRENCE_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.recurrenceCount && form.recurrenceUnit && form.recurrenceUnit !== NONE && (
                  <p className="text-xs text-[#0A9696]">
                    → {form.recurrenceCount} fois par {form.recurrenceUnit}
                  </p>
                )}
              </div>
            )}

            {/* ── Champs date / durée / participants (masqués pour récurrentes) ── */}
            {!isRecurringForm && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nombre max de participants</Label>
                    <Input type="number" min="1" value={form.maxPeople} onChange={(e) => setField("maxPeople", e.target.value)} placeholder="Illimité si vide" />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Points TRIBU</Label>
                <Input type="number" min="0" value={form.points} onChange={(e) => setField("points", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Durée estimée (heures)</Label>
                <Input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => setField("estimatedHours", e.target.value)} placeholder="Ex: 2.5" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Référant</Label>
              <Input value={form.referent} onChange={(e) => setField("referent", e.target.value)} placeholder="Nom du référant" />
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

      {/* ══════════ Dialog participants ══════════ */}
      <Dialog open={!!participantsMission} onOpenChange={() => setParticipantsMission(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto">
          {participantsMission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 flex-wrap">
                  {participantsMission.type === "Récurrente" && (
                    <RefreshCw className="w-4 h-4 text-[#0A9696]" />
                  )}
                  {participantsMission.title}
                  <Badge className={STATE_COLORS[participantsMission.state]} variant="outline">
                    {STATE_LABELS[participantsMission.state]}
                  </Badge>
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                    {participantsMission.pole && <span>{participantsMission.pole.name}</span>}
                    {participantsMission.type === "Récurrente" && participantsMission.recurrenceCount && participantsMission.recurrenceUnit
                      ? <span>· {participantsMission.recurrenceCount}× / {participantsMission.recurrenceUnit}</span>
                      : participantsMission.date
                        ? <span>· {new Date(participantsMission.date).toLocaleDateString("fr-FR")}</span>
                        : null
                    }
                    <span>· {participantsMission.points} pts max</span>
                    {participantsMission.estimatedHours && <span>· {participantsMission.estimatedHours}h estimées</span>}
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Détails */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 bg-gray-50 rounded-lg text-sm">
                {participantsMission.description && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Description :</span>{" "}
                    <span className="text-gray-800">{participantsMission.description}</span>
                  </div>
                )}
                {participantsMission.referent && (
                  <div>
                    <span className="text-gray-500">Référent :</span>{" "}
                    <span className="text-gray-800">{participantsMission.referent}</span>
                  </div>
                )}
                {participantsMission.type && (
                  <div>
                    <span className="text-gray-500">Type :</span>{" "}
                    <span className="text-gray-800">{participantsMission.type}</span>
                  </div>
                )}
                {participantsMission.priority && (
                  <div>
                    <span className="text-gray-500">Priorité :</span>{" "}
                    <span className="text-gray-800 capitalize">{participantsMission.priority}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Réalisations :</span>{" "}
                  <span className="text-gray-800">{participantsMission._count.realisations}</span>
                </div>
                {!isRecurringMode && (
                  <div>
                    <span className="text-gray-500">Inscrits :</span>{" "}
                    <span className="text-gray-800">{participantsMission._count.inscriptions} / {participantsMission.maxPeople ?? "∞"}</span>
                  </div>
                )}
              </div>

              {/* Actions mission */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { setParticipantsMission(null); openEdit(participantsMission); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Modifier la mission
                </Button>
              </div>

              <hr className="border-gray-200" />

              {/* ── MODE RÉCURRENT ── */}
              {isRecurringMode ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0A9696]" />
                    Participations enregistrées
                    <span className="font-normal text-gray-400">({recurringParticipations.length})</span>
                  </p>

                  {participantsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                  ) : recurringParticipations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Aucune participation enregistrée</div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                      <table className="w-full min-w-[500px] text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Bénévole</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Date de participation</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Durée</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Points</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {recurringParticipations.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{r.user.firstname} {r.user.lastname}</p>
                                <p className="text-xs text-gray-500">{r.user.email}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {r.participatedAt
                                  ? new Date(r.participatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                  : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {r.effectiveDuration ? `${r.effectiveDuration}h` : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-medium text-yellow-700">{r.pointsAwarded ?? 0} pts</span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === r.id + "-remove"}
                                  onClick={() => removeRecurringParticipation(r.id)}
                                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  {actionLoading === r.id + "-remove"
                                    ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                    : <Trash2 className="w-3 h-3" />}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                /* ── MODE CLASSIQUE ── */
                <>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Inscrits
                    <span className="font-normal text-gray-400">
                      ({participants.length} inscription{participants.length !== 1 ? "s" : ""} · {participants.filter((p) => p.completed).length} réalisation{participants.filter((p) => p.completed).length !== 1 ? "s" : ""})
                    </span>
                  </p>

                  {/* Ajout d'un bénévole */}
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> Associer un bénévole
                    </p>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        placeholder="Rechercher par nom ou email..."
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                    {addSearch.trim() !== "" && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
                        {availableUsers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-3">Aucun bénévole trouvé</p>
                        ) : (
                          availableUsers.slice(0, 10).map((u) => (
                            <button
                              key={u.id}
                              disabled={addLoading}
                              onClick={() => addParticipant(u.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-[#E0F6F7] flex items-center justify-between group transition-colors"
                            >
                              <span>
                                <span className="font-medium text-gray-900">{u.firstname} {u.lastname}</span>
                                <span className="text-gray-500 ml-2">{u.email}</span>
                              </span>
                              <span className="text-[#0A9696] text-xs opacity-0 group-hover:opacity-100 transition-opacity">Ajouter →</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Table participants */}
                  {participantsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Aucun participant inscrit</div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Bénévole</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Disponible de</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Pendant</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Commentaire</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 hidden sm:table-cell">Inscrit le</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Statut</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {participants.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{p.firstname} {p.lastname}</p>
                                <p className="text-xs text-gray-500">{p.email}</p>
                                {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {p.availableFrom
                                  ? new Date(p.availableFrom).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                  : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {p.availableDuration ? `${p.availableDuration}h` : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px]">
                                {p.comment ? <span className="italic">&ldquo;{p.comment}&rdquo;</span> : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">
                                {new Date(p.inscribedAt).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-4 py-3">
                                {p.completed ? (
                                  <div className="space-y-1">
                                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit" variant="outline">
                                      <UserCheck className="w-3 h-3" /> Réalisé
                                    </Badge>
                                    <p className="text-xs text-gray-500">
                                      {p.effectiveDuration != null ? `${p.effectiveDuration}h · ` : ""}
                                      <span className="font-medium text-yellow-700">{p.pointsAwarded ?? 0} pts</span>
                                    </p>
                                  </div>
                                ) : (
                                  <Badge className="bg-[#E0F6F7] text-[#004F4F] border-[#69C3D2] w-fit" variant="outline">Inscrit</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  {p.completed ? (
                                    <>
                                      <Button size="sm" variant="outline" disabled={actionLoading === p.id + "-status" || actionLoading === p.id + "-remove"} onClick={() => openValidateDialog(p)} className="text-xs text-[#0A9696] border-[#69C3D2] hover:bg-[#E0F6F7]">
                                        {actionLoading === p.id + "-status" ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : <Pencil className="w-3 h-3" />}
                                      </Button>
                                      <Button size="sm" variant="outline" disabled={actionLoading === p.id + "-status" || actionLoading === p.id + "-remove"} onClick={() => cancelValidation(p)} className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50">
                                        <XCircle className="w-3 h-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button size="sm" variant="outline" disabled={actionLoading === p.id + "-status" || actionLoading === p.id + "-remove"} onClick={() => openValidateDialog(p)} className="text-xs text-green-600 border-green-200 hover:bg-green-50">
                                      {actionLoading === p.id + "-status" ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : <CheckCircle2 className="w-3 h-3" />}
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" disabled={actionLoading === p.id + "-remove" || actionLoading === p.id + "-status"} onClick={() => removeParticipant(p)} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                                    {actionLoading === p.id + "-remove" ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : <UserMinus className="w-3 h-3" />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setParticipantsMission(null)}>Fermer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog validation points */}
      <Dialog open={!!validateDialog} onOpenChange={() => setValidateDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{validateDialog?.isEdit ? "Modifier les points" : "Valider la participation"}</DialogTitle>
            <DialogDescription>
              {validateDialog?.participant.firstname} {validateDialog?.participant.lastname}
              {validateDialog?.isEdit && (
                <span className="block text-xs mt-1">Points actuels : {validateDialog.participant.pointsAwarded ?? 0} pts</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label htmlFor="customPoints">Points TRIBU à attribuer</Label>
            <div className="flex items-center gap-2">
              <Input
                id="customPoints"
                type="number"
                min="0"
                value={validateDialog?.customPoints ?? 0}
                onChange={(e) => setValidateDialog((d) => d ? { ...d, customPoints: parseInt(e.target.value) || 0 } : null)}
                className="w-32"
              />
              <span className="text-sm text-gray-500">pts</span>
              {participantsMission && (
                <Button type="button" variant="ghost" size="sm" className="text-xs text-gray-400"
                  onClick={() => setValidateDialog((d) => d ? { ...d, customPoints: participantsMission.points } : null)}>
                  Max ({participantsMission.points})
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateDialog(null)}>Annuler</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmValidation}>
              {validateDialog?.isEdit ? "Enregistrer" : "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la mission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.title}</strong> ? Toutes les inscriptions et réalisations associées seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMission(deleteTarget.id)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
