// @ts-expect-error we need this to extend the NextAuth session type
import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            airtableId?: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}