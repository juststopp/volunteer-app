import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding...")

    // Pôles par défaut
    const poles = await Promise.all([
        prisma.pole.upsert({
            where: { name: "Communication" },
            update: {},
            create: { name: "Communication", description: "Gestion de la communication et des réseaux sociaux" },
        }),
        prisma.pole.upsert({
            where: { name: "Logistique" },
            update: {},
            create: { name: "Logistique", description: "Organisation et logistique des événements" },
        }),
        prisma.pole.upsert({
            where: { name: "Animation" },
            update: {},
            create: { name: "Animation", description: "Animation et activités pour les bénévoles" },
        }),
        prisma.pole.upsert({
            where: { name: "Technique" },
            update: {},
            create: { name: "Technique", description: "Support technique et informatique" },
        }),
        prisma.pole.upsert({
            where: { name: "Général" },
            update: {},
            create: { name: "Général", description: "Missions transverses" },
        }),
    ])

    console.log(`✅ ${poles.length} pôles créés`)

    // Compte admin par défaut
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@sheva.fr"
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin1234!"

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: "ADMIN", validated: true },
        create: {
            email: adminEmail,
            firstname: "Admin",
            lastname: "SHEVA",
            password: hashedPassword,
            role: "ADMIN",
            validated: true,
            poleId: poles[0].id,
        },
    })

    console.log(`✅ Compte admin créé : ${admin.email} / ${adminPassword}`)
    console.log("🎉 Seed terminé !")
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
