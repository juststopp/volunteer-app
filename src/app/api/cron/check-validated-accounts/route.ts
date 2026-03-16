import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable";
import { sendAccountValidatedMail } from "@/lib/mail";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Récupère les utilisateurs avec un airtableId mais sans email de validation envoyé
    const users = await prisma.user.findMany({
        where: {
            airtableId: { not: null },
            validationEmailSentAt: null,
        },
        select: {
            id: true,
            firstname: true,
            email: true,
            airtableId: true,
        },
    });

    let emailsSent = 0;

    for (const user of users) {
        try {
            const airtableUser = await airtableService.getUser(user.airtableId!);

            if (!airtableUser.compteValide) continue;

            await sendAccountValidatedMail({
                to: { name: user.firstname, email: user.email },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { validationEmailSentAt: new Date() },
            });

            emailsSent++;
        } catch (error) {
            console.error(`Erreur pour l'utilisateur ${user.airtableId}:`, error);
        }
    }

    return NextResponse.json({ message: `${emailsSent} email(s) envoyé(s)` }, { status: 200 });
}
