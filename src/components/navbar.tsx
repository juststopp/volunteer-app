import Image from "next/image";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/../public/logo.png";

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const name = pathname.charAt(1).toUpperCase() + pathname.slice(2);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (session.user.validated === false) {
    router.push("/auth/non-validated");
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-auto bg-white shadow-sm border-b-[3px]" style={{ borderBottomColor: "#0A9696" }}>
      {/* Bandeau SHEVA */}
      <div className="py-1.5 px-4 text-center text-xs font-medium text-white" style={{ backgroundColor: "#004F4F" }}>
        <span className="opacity-80">SHEVA · Pôle équestre Paris Val-de-Marne</span>
      </div>
      <div className="p-4 sm:p-5 max-w-4xl mx-auto">
        {/* Desktop et header mobile */}
        <div className="flex justify-between items-center">
          <Image src={Logo} alt="Logo SHEVA" width={44} height={44} className="shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 px-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{name}</h1>
            <p className="text-sm truncate mt-0.5" style={{ color: "#0A9696" }}>
              Bonjour, {session.user?.name || session.user?.email}
            </p>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => router.push("/missions")}
              className={pathname.startsWith("/missions") ? "bg-[#E0F6F7] text-[#004F4F] font-semibold" : "text-gray-700 hover:text-[#004F4F] hover:bg-[#E0F6F7]"}
            >
              Missions
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/profil")}
              className={pathname.startsWith("/profil") ? "bg-[#E0F6F7] text-[#004F4F] font-semibold" : "text-gray-700 hover:text-[#004F4F] hover:bg-[#E0F6F7]"}
            >
              Profil
            </Button>
            {session.user.role === "ADMIN" && (
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="text-gray-700 hover:text-[#004F4F] hover:bg-[#E0F6F7]"
              >
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-2 text-gray-600 border-gray-300 hover:bg-gray-50"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Déconnexion
            </Button>
          </div>

          {/* Bouton hamburger mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t animate-in slide-in-from-top-2 duration-200" style={{ borderColor: "#E0F6F7" }}>
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/missions")}
                className="justify-start py-3 px-4 text-left hover:bg-[#E0F6F7] hover:text-[#004F4F]"
              >
                Missions
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profil")}
                className="justify-start py-3 px-4 text-left hover:bg-[#E0F6F7] hover:text-[#004F4F]"
              >
                Profil
              </Button>
              {session.user.role === "ADMIN" && (
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/admin")}
                  className="justify-start py-3 px-4 text-left hover:bg-[#E0F6F7] hover:text-[#004F4F]"
                >
                  Administration
                </Button>
              )}
              <div className="pt-2 border-t" style={{ borderColor: "#E0F6F7" }}>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start py-3 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Navbar };
