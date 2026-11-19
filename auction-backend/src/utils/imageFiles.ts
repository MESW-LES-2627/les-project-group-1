import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "../config/uploads";

/** Detects the real image type from the file's first bytes, so a wrong Content-Type can't sneak a non-image in. */
export function detectImageType(buf: Buffer): "png" | "jpg" | "webp" | null {
    if (buf.length < 12) return null;
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
    return null;
}

/** Saves one image to uploads/<folder>/ and returns its path, e.g. /uploads/listings/listing-1-1731900000000-ab12cd34.png */
export async function saveImage(buffer: Buffer, folder: "logos" | "listings", prefix: string) {
    const ext = detectImageType(buffer);
    if (!ext) throw new Error("not_an_image");

    const dir = path.join(UPLOADS_DIR, folder);
    await mkdir(dir, { recursive: true });
    const filename = `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/${folder}/${filename}`;
}

/** Saves several images. If one fails, the ones already written are deleted again. */
export async function saveImages(buffers: Buffer[], folder: "logos" | "listings", prefix: string) {
    const saved: string[] = [];
    try {
        for (const buffer of buffers) saved.push(await saveImage(buffer, folder, prefix));
        return saved;
    } catch (error) {
        await removeUploadedFiles(saved);
        throw error;
    }
}

/** Deletes files by their /uploads/... path. Anything else (for example frontend assets) is ignored. Never throws. */
export async function removeUploadedFiles(urlPaths: Array<string | null | undefined>) {
    for (const urlPath of urlPaths) {
        if (!urlPath || !urlPath.startsWith("/uploads/")) continue;
        const full = path.resolve(UPLOADS_DIR, urlPath.slice("/uploads/".length));
        if (!full.startsWith(UPLOADS_DIR + path.sep)) continue; // never leave the uploads folder
        try {
            await unlink(full);
        } catch {
            // already gone: nothing to do
        }
    }
}