"use client";

import { useState, useEffect } from "react";
import { Mission } from "@/types/missions";
import { MissionCard } from "./mission-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export function MissionsList() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [etatFilter, setEtatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [prioriteFilter, setPrioriteFilter] = useState("all");

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch("/api/missions");
        if (response.ok) {
          const missionsData = await response.json();
          setMissions(missionsData);
          setFilteredMissions(missionsData);
        } else {
          setError("Erreur lors du chargement des missions");
        }
      } catch (error) {
        setError("Erreur lors du chargement des missions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  useEffect(() => {
    let filtered = missions;

    if (searchTerm) {
      filtered = filtered.filter(
        (mission) =>
          mission.mission.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mission.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (etatFilter !== "all") {
      filtered = filtered.filter((mission) =>
        mission.etat?.toLowerCase().includes(etatFilter.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (mission) =>
          mission.typeMission?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    if (prioriteFilter !== "all") {
      filtered = filtered.filter((mission) =>
        mission.priorite?.toLowerCase().includes(prioriteFilter.toLowerCase())
      );
    }

    setFilteredMissions(filtered);
  }, [missions, searchTerm, etatFilter, typeFilter, prioriteFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Chargement des missions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const uniqueEtats = [
    ...new Set(
      missions
        .map((m) => {
          const etat = m.etat?.replace(/📝|🔄|✅|❌/g, "").trim();
          return etat;
        })
        .filter(Boolean)
    ),
  ];

  const uniqueTypes = [
    ...new Set(missions.map((m) => m.typeMission).filter(Boolean)),
  ];

  const uniquePriorites = [
    ...new Set(
      missions
        .map((m) => {
          const priorite = m.priorite?.replace(/🔴|🟠|🟡|🟢/g, "").trim();
          return priorite;
        })
        .filter(Boolean)
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={etatFilter} onValueChange={setEtatFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              {uniqueEtats.map((etat) => (
                <SelectItem key={etat} value={etat.toLowerCase()}>
                  {etat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              {uniquePriorites.map((priorite) => (
                <SelectItem key={priorite} value={priorite.toLowerCase()}>
                  {priorite}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Aucune mission trouvée</div>
          {searchTerm ||
          etatFilter !== "all" ||
          typeFilter !== "all" ||
          prioriteFilter !== "all" ? (
            <p className="text-sm text-gray-400 mt-2">
              Essayez de modifier vos filtres de recherche
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-2">
              Les missions apparaîtront ici une fois créées
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {filteredMissions.length} mission
              {filteredMissions.length > 1 ? "s" : ""}
            </h2>
            <div className="text-sm text-gray-500">
              Triées par date de mission
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
