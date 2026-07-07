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

/**
 * Absolute path for a stored file's relative storagePath.
 * Uses path.resolve to collapse any `..` components, then verifies the result is
 * still strictly inside the uploads directory. This is a traversal-proof
 * containment check: even a malicious storagePath written directly to the DB
 * cannot escape the uploads root.
 */
export function resolveStored(storagePath: string): string {
  const base = uploadsDir();
  const resolved = path.resolve(base, storagePath);
  const allowedPrefix = base.endsWith(path.sep) ? base : base + path.sep;
  if (!resolved.startsWith(allowedPrefix)) {
    console.error(
      `[storage] Path traversal detected: storagePath=${JSON.stringify(storagePath)} ` +
        `resolved=${JSON.stringify(resolved)} base=${JSON.stringify(base)}`,
    );
    throw new Error("storage_path_traversal");
  }
  return resolved;
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
  const dest = resolveStored(relName); // throws on traversal before any I/O
  await ensureUploadsDir();
  await fs.writeFile(dest, buf);
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
