"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
        console.log(error);
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
          mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mission.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((mission) => mission.state === stateFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (mission) => mission.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredMissions(filtered);
  }, [missions, searchTerm, stateFilter, typeFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const uniqueTypes = [
    ...new Set(missions.map((m) => m.type).filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-6 max-w-screen p-10">
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
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="ACTIVE">En cours</SelectItem>
              <SelectItem value="CLOSED">Fermée</SelectItem>
              <SelectItem value="DONE">Terminée</SelectItem>
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
        </div>
      </div>

      {isLoading === false && filteredMissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Aucune mission trouvée</div>
          {searchTerm || stateFilter !== "all" || typeFilter !== "all" ? (
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">
                Chargement des missions...
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  currentUser={session?.user}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
