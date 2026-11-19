import path from "node:path";

/** Uploaded files (club logos, listing images) live here and are served at /uploads. Mount a volume on this folder in production. */
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");