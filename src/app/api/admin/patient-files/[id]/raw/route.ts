import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { readStored } from "@/lib/server/storage";

/** Stream the raw binary (auth-guarded). Used by <img> and download links. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response("unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const file = await prisma.patientFile.findUnique({ where: { id } });
  if (!file) return new Response("not found", { status: 404 });

  let buf: Buffer;
  try {
    buf = await readStored(file.storagePath);
  } catch {
    return new Response("gone", { status: 410 });
  }

  const download = new URL(req.url).searchParams.get("download") === "1";
  const disposition = download ? "attachment" : "inline";
  // Quote-safe ASCII fallback + RFC 5987 UTF-8 name for non-ASCII filenames.
  const asciiName = file.fileName.replace(/["\\\r\n]/g, "_");

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      // Never let the browser MIME-sniff user-uploaded bytes into something executable.
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
