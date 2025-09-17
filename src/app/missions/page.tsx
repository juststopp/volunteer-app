"use client";

import { Navbar } from "@/components/navbar";
import { MissionsList } from "@/components/missions/missions-list";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <>
      <Suspense>
        <Navbar />
      </Suspense>
      <MissionsList />
    </>
  );
}
