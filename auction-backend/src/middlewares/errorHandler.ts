import type { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found." });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err.name === "MulterError") {
    const code = (err as any).code;
    if (code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "file_too_large" }); // max 2 MB per image
    if (code === "LIMIT_UNEXPECTED_FILE" || code === "LIMIT_FILE_COUNT") return res.status(400).json({ error: "too_many_or_unexpected_files" });
    return res.status(400).json({ error: "upload_error" });
  }
  if ((err as any).type === "entity.too.large") return res.status(413).json({ error: "File is too large (max 2 MB)." });
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
}