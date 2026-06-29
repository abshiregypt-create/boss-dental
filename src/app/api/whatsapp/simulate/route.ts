import { NextResponse } from "next/server";
import { processInbound } from "@/lib/server/wa-runtime";

/**
 * Local simulator for the WhatsApp booking agent — lets you test the whole
 * conversation WITHOUT Meta credentials or a public URL.
 *
 *   POST /api/whatsapp/simulate  { "phone": "+201000000000", "text": "حجز" }
 *   -> { replies: [ "...bot reply..." ], bookingCode?: "ABC123" }
 *
 * Guarded: only enabled when WHATSAPP_PROVIDER is "mock" (the default dev/local
 * setting). The moment you switch to the live "metaCloud" provider, this route
 * returns 404 so it can never be hit in production.
 */
export async function POST(req: Request) {
  // Disabled only for the official Meta provider (production). Allowed for the
  // local/unofficial providers (mock, waweb, wa) so the flow stays testable.
  const provider = process.env.WHATSAPP_PROVIDER || "mock";
  if (provider === "metaCloud") {
    return new NextResponse("not found", { status: 404 });
  }

  let body: { phone?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = String(body.phone ?? "").trim();
  const text = String(body.text ?? "");
  if (!phone || !text) {
    return NextResponse.json({ error: "missing phone or text" }, { status: 400 });
  }

  const result = await processInbound(phone, text);
  return NextResponse.json(result);
}
