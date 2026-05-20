"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Target,
  MapPin,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/missions", label: "Missions", icon: Target },
  { href: "/admin/poles", label: "Pôles", icon: MapPin },
];

function SidebarContent({
  pathname,
  userName,
  onClose,
}: {
  pathname: string;
  userName?: string | null;
  onClose: () => void;
}) {
  return (
    <>
      {/* Logo + titre */}
      <div className="p-5 border-b border-[#1a7070]">
        <p className="text-xs text-[#7dd4d4] uppercase tracking-widest mb-1 font-medium">
          Administration
        </p>
        <p className="text-sm font-semibold text-white truncate">
          SHEVA Bénévoles
        </p>
        {userName && (
          <p className="text-xs text-[#7dd4d4] truncate mt-0.5">{userName}</p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium",
                isActive
                  ? "bg-white text-[#004F4F] shadow-sm"
                  : "text-[#a8dede] hover:bg-[#1a7070] hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#0A9696]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1a7070] space-y-1">
        <Link
          href="/missions"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#a8dede] hover:bg-[#1a7070] hover:text-white transition-colors"
        >
          ← Retour à l&apos;app
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[#a8dede] hover:text-white hover:bg-[#1a7070] px-3"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Déconnexion
        </Button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 text-white md:hidden"
           style={{ backgroundColor: "#004F4F" }}>
        <span className="text-sm font-semibold tracking-wide">SHEVA Bénévoles</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-[#1a7070] transition-colors"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay nav */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute top-14 left-0 bottom-0 w-64 flex flex-col overflow-y-auto"
            style={{ backgroundColor: "#004F4F" }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              pathname={pathname}
              userName={session?.user?.name}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 text-white flex-col flex-shrink-0"
        style={{ backgroundColor: "#004F4F" }}
      >
        <SidebarContent
          pathname={pathname}
          userName={session?.user?.name}
          onClose={() => {}}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
