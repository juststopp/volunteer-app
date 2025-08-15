"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "../phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Airtable from "airtable";

interface Pole {
  id: string;
  name: string;
  image: Airtable.Attachment;
}

export function SignUpForm() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [poleId, setPoleId] = useState("");
  const [poles, setPoles] = useState<Pole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPoles, setIsLoadingPoles] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchPoles = async () => {
      try {
        const response = await fetch("/api/poles");
        if (response.ok) {
          const polesData = await response.json();
          setPoles(polesData);
        } else {
          setError("Erreur lors du chargement des pôles");
        }
      } catch (error) {
        setError("Erreur lors du chargement des pôles");
        console.log(error);
      } finally {
        setIsLoadingPoles(false);
      }
    };

    fetchPoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (!poleId) {
      setError("Veuillez sélectionner un pôle");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          phone,
          password,
          poleId,
        }),
      });

      if (response.ok) {
        router.push("/auth/signin?message=Compte créé avec succès");
      } else {
        const data = await response.json();
        setError(data.message || "Une erreur s'est produite");
      }
    } catch (error) {
      setError("Une erreur s'est produite");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
        <CardDescription>
          Créez un compte pour accéder à l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Prénom</Label>
            <Input
              id="name"
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <PhoneInput id="phone" value={phone} onChange={setPhone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pole">Pôle</Label>
            <Select
              value={poleId}
              onValueChange={setPoleId}
              disabled={isLoadingPoles}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingPoles ? "Chargement..." : "Sélectionnez un pôle"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {poles.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    <Image
                      src={pole.image.url}
                      alt={pole.name}
                      width={50}
                      height={25}
                    />
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingPoles}
          >
            {isLoading ? "Création..." : "Créer un compte"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
