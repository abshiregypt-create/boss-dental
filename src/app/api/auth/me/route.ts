import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ user: session });
}
