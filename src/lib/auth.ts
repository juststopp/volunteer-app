import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { prisma } from "./db"
import { sendResetPasswordMail } from "./mail"
import { randomBytes } from "crypto"

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
                    where: { email: credentials.email }
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

                return {
                    id: user.id,
                    validated: user.validated,
                    role: user.role,
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
                token.role = (user as { role?: string }).role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session && session.user) {
                session.user.id = token.id as string
            }

            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            })

            session.user.validated = user?.validated ?? false
            session.user.role = user?.role ?? "USER"
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

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpiry }
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
            resetTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) {
        throw new Error("Le token de réinitialisation est invalide ou a expiré");
    }

    const hashedPassword = await bcrypt.hash(password as string, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });
}
