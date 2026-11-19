import { API_URL } from "@/lib/api"

/**
 * Uploaded files (club logos, listing images) are served by the backend at /uploads, so they need
 * the API address in front. Other paths, like /images/..., are files of this frontend and stay as they are.
 */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return path.startsWith("/uploads/") ? `${API_URL}${path}` : path
}
