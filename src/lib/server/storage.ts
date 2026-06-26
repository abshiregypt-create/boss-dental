import { promises as fs } from "fs";
import path from "path";

/** Root dir for patient file binaries (kept outside .next, gitignored). */
export function uploadsDir(): string {
  const dir = process.env.UPLOADS_DIR || path.join(process.cwd(), "private-uploads");
  return path.join(dir, "patient-files");
}

export async function ensureUploadsDir(): Promise<string> {
  const dir = uploadsDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Absolute path for a stored file's relative storagePath. */
export function resolveStored(storagePath: string): string {
  return path.join(uploadsDir(), storagePath);
}

const SAFE = /[^a-zA-Z0-9._-]/g;
export function safeName(name: string): string {
  const base = path.basename(name).replace(SAFE, "_");
  return base.slice(-120) || "file";
}

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function writeFileBuffer(relName: string, buf: Buffer): Promise<void> {
  await ensureUploadsDir();
  await fs.writeFile(resolveStored(relName), buf);
}

export async function deleteStored(storagePath: string): Promise<void> {
  try {
    await fs.unlink(resolveStored(storagePath));
  } catch {
    /* already gone */
  }
}

export async function readStored(storagePath: string): Promise<Buffer> {
  return fs.readFile(resolveStored(storagePath));
}
