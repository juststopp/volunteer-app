"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Shield } from "lucide-react";

export default function AccountPending() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="w-full max-w-md bg-red-50/80 border-red-200 border-2 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="w-16 h-16 text-red-400" />
              <div className="absolute -bottom-1 -right-1 bg-orange-100 rounded-full p-1">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-red-800">
            Compte en attente de validation
          </CardTitle>
          <CardDescription className="text-red-700/80">
            Votre inscription doit être approuvée par un administrateur
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-4 rounded-lg bg-white/60 border border-red-100">
            <p className="text-sm font-medium mb-2 text-red-800">
              Votre compte a été créé avec succès, mais il doit être validé par
              un administrateur avant que vous puissiez vous connecter.
            </p>
            <p className="text-xs text-red-600/75">
              Cette validation est nécessaire pour des raisons de sécurité.
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-100 to-orange-100 p-4 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium mb-2">
              ⏱️ Délai habituel : 24-48 heures
            </p>
            <p className="text-xs text-red-600/80">
              En cas d&apos;urgence, contactez directement notre support
            </p>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <Button
              asChild
              className="bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              <Link href="/auth/signin">← Retour à la connexion</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
