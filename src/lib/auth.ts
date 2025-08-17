import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { prisma } from "./db"
import { airtableService } from "./airtable"

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