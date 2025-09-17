"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("Token manquant ou invalide");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur s'est produite");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
        }, 3000);
      }
    } catch (error) {
      setError("Une erreur s'est produite");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-red-600">
            Lien invalide
          </CardTitle>
          <CardDescription>
            Le lien de réinitialisation est manquant ou invalide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-green-600">
            Mot de passe modifié !
          </CardTitle>
          <CardDescription>
            Votre mot de passe a été modifié avec succès
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Vous allez être redirigé vers la page de connexion dans quelques
              secondes...
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">Se connecter maintenant</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Nouveau mot de passe
        </CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé pour votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
            />
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p>Votre mot de passe doit contenir :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li
                className={
                  password.length >= 8 ? "text-green-600" : "text-gray-400"
                }
              >
                Au moins 8 caractères
              </li>
              <li
                className={
                  /[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"
                }
              >
                Une lettre majuscule
              </li>
              <li
                className={
                  /[a-z]/.test(password) ? "text-green-600" : "text-gray-400"
                }
              >
                Une lettre minuscule
              </li>
              <li
                className={
                  /\d/.test(password) ? "text-green-600" : "text-gray-400"
                }
              >
                Un chiffre
              </li>
            </ul>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Modification..." : "Modifier le mot de passe"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
