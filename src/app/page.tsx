"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/missions");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Bienvenue sur Mon App
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Connectez-vous ou créez un compte pour accéder à votre dashboard
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg">Se connecter</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg">
              S'inscrire
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
