import { NextRequest, NextResponse } from "next/server";
import { sendAccountValidatedMail } from "@/lib/mail";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Comptes validés par un admin mais sans email de confirmation envoyé
    const users = await prisma.user.findMany({
        where: {
            validated: true,
            validationEmailSentAt: null,
        },
        select: {
            id: true,
            firstname: true,
            email: true,
        },
    });

    let emailsSent = 0;

    for (const user of users) {
        try {
            await sendAccountValidatedMail({
                to: { name: user.firstname, email: user.email },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { validationEmailSentAt: new Date() },
            });

            emailsSent++;
        } catch (error) {
            console.error(`Erreur pour l'utilisateur ${user.id}:`, error);
        }
    }

    return NextResponse.json({ message: `${emailsSent} email(s) envoyé(s)` }, { status: 200 });
}
