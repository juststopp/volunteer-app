import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

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

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-auto p-6 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Desktop et header mobile */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {session.user?.name || session.user?.email}
            </p>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/missions")}>
              Missions
            </Button>

            <Button variant="ghost" onClick={() => router.push("/profile")}>
              Profile
            </Button>

            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Se déconnecter
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
          <div className="md:hidden mt-4 py-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/missions")}
                className="justify-start py-3 px-4 text-left hover:bg-gray-50"
              >
                Missions
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className="justify-start py-3 px-4 text-left hover:bg-gray-50"
              >
                Profile
              </Button>

              <div className="border-t border-gray-100 pt-3">
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full justify-start py-3 px-4"
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
