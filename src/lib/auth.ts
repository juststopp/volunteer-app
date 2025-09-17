import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { SecureUniqueForge } from "unique-forge"

import { prisma } from "./db"
import { airtableService } from "./airtable"
import { sendResetPasswordMail } from "./mail"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user || !user.password) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                const airtableUser = await airtableService.getUser(user.airtableId as string);
                if (!airtableUser) {
                    return null;
                }

                return {
                    id: user.id,
                    airtableId: user.airtableId,
                    validated: airtableUser.compteValide,
                    email: user.email,
                    name: user.firstname + " " + user.lastname,
                }
            }
        })
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token && session && session.user) {
                session.user.id = token.id as string
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: session.user.id
                }
            })

            const airtableUser = await airtableService.getUser(user?.airtableId as string);

            session.user.airtableId = user?.airtableId || null
            session.user.validated = airtableUser.compteValide || false
            return session
        },
    },
}

export async function resetPassword(email: string) {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("Aucun utilisateur trouvé avec cet email");
    }

    const forge = new SecureUniqueForge();
    const resetToken = forge.generate() as string;
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.updateMany({
        where: { email },
        data: {
            resetToken,
            resetTokenExpiry
        }
    });

    sendResetPasswordMail({
        to: { email: user.email, name: user.firstname },
        subject: "Réinitialisation de votre mot de passe",
        resetToken
    })
}

export async function updatePassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        throw new Error("Le token de réinitialisation est invalide ou a expiré");
    }

    const hashedPassword = await bcrypt.hash(password as string, 12);

    await prisma.user.updateMany({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });
}