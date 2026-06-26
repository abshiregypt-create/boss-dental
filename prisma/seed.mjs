import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_DOCTOR_EMAIL || "doctor@bdic.clinic";
  const password = process.env.SEED_DOCTOR_PASSWORD || "bdic12345";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Dr. Badawi",
      role: "doctor",
    },
  });

  await prisma.setting.upsert({
    where: { key: "clinic" },
    update: {},
    create: {
      key: "clinic",
      value: JSON.stringify({
        openMin: 10 * 60,
        closeMin: 22 * 60,
        slotMin: 30,
        closedWeekday: 5,
      }),
    },
  });

  console.log(`Seeded doctor: ${email} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
