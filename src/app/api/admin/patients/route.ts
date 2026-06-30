import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { sessionTypes, sessionTypeById } from "@/lib/dashboard";

/**
 * Admin: list patient accounts created from bookings (website + WhatsApp).
 * Each patient's bookings are attached as sessions, matched by the trailing
 * phone digits so the doctor sees their history under the client card.
 */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const [patients, appts] = await Promise.all([
    prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.appointment.findMany({ orderBy: { scheduledAt: "asc" }, take: 1000 }),
  ]);

  const tail = (p: string) => (p || "").replace(/\D/g, "").slice(-9);

  const sessionStatus = (s: string): "completed" | "scheduled" | "cancelled" =>
    s === "completed" ? "completed" : s === "cancelled" || s === "declined" ? "cancelled" : "scheduled";

  // A patient becomes a "client account" once the doctor confirms a booking for
  // them. Show only patients with at least one confirmed/completed appointment,
  // matched by the trailing phone digits.
  const confirmedTails = new Set(
    appts
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .map((a) => tail(a.phone))
      .filter((d) => d.length >= 8)
  );

  const mapped = patients
    .filter((p) => confirmedTails.has(tail(p.phone)))
    .map((p) => {
    const pt = tail(p.phone);
    const sessions =
      pt.length >= 8
        ? appts
            .filter((a) => tail(a.phone) === pt)
            .map((a) => {
              const typeId = sessionTypes.some((s) => s.id === a.serviceId) ? a.serviceId : "checkup";
              return {
                id: `wa-${a.code}`,
                typeId,
                date: a.scheduledAt.toISOString().slice(0, 10),
                cost: sessionTypeById(typeId).price,
                status: sessionStatus(a.status),
                notes: a.complaint ?? undefined,
              };
            })
        : [];

    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email ?? "",
      gender: (p.gender as "male" | "female" | undefined) ?? undefined,
      source: "booking" as const,
      createdAt: p.createdAt.toISOString().slice(0, 10),
      notes: p.notes ?? "",
      sessions,
      payments: [],
    };
  });

  return NextResponse.json({ patients: mapped });
}
