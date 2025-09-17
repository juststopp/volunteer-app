"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Une erreur s'est produite");
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setError("Une erreur s'est produite");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-green-600">
            Email envoyé !
          </CardTitle>
          <CardDescription>Vérifiez votre boîte mail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Si votre email existe dans notre base, vous recevrez un lien de
                réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-gray-500">
                Pensez à vérifier vos spams !
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full"
              >
                Renvoyer un email
              </Button>

              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Mot de passe oublié ?
        </CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm space-y-2">
          <div>
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
          <div>
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
