"use client";

import { Navbar } from "@/components/navbar";
import { MissionsList } from "@/components/missions/missions-list";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <MissionsList />
    </>
  );
}
