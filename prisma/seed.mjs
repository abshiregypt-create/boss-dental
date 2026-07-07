import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Per-clinic admin defaults so a fresh deploy seeds a branded login.
  // All overridable via SEED_DOCTOR_* env vars (set these in Railway).
  const slug = process.env.NEXT_PUBLIC_CLINIC || process.env.CLINIC || "badawi";
  const DEFAULTS = {
    badawi: { email: "doctor@bdic.clinic", name: "Dr. Badawi", username: "badawi" },
    ibrahim: { email: "doctor@theboss.clinic", name: "Dr. Ibrahim Salah", username: "boss" },
    dce: { email: "doctor@dentalcenterofegypt.com", name: "Dr. Medhat Basseem", username: "dental" },
    clinva: { email: "admin@clinva.app", name: "Clinva Admin", username: "admin" },
  };
  const d = DEFAULTS[slug] || { email: `doctor@${slug}.clinic`, name: "Doctor", username: slug };

  const email = process.env.SEED_DOCTOR_EMAIL || d.email;
  const username = (process.env.SEED_DOCTOR_USERNAME || d.username).toLowerCase();
  const password = process.env.SEED_DOCTOR_PASSWORD || "boss2026";
  const name = process.env.SEED_DOCTOR_NAME || d.name;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { username },
    create: {
      email,
      username,
      passwordHash,
      name,
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

  console.log(`Seeded doctor: ${username} (${email}) / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
