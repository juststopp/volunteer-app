import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const name = pathname.charAt(1).toUpperCase() + pathname.slice(2);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

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

  return (
    <div className="min-h-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {session.user?.name || session.user?.email}
            </p>
          </div>

          <Button variant="ghost" onClick={() => router.push("/missions")}>
            Missions
          </Button>

          <Button variant="ghost" onClick={() => router.push("/profile")}>
            Profile
          </Button>

          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export { Navbar };
