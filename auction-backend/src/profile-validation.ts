export type ProfileInput = {
    username: string;
    country: string;
};

export type ProfileValidation =
    | { ok: true; value: ProfileInput }
    | { ok: false; error: string };

export function validateProfileInput(body: unknown): ProfileValidation {
    if (typeof body !== "object" || body === null) return { ok: false, error: "invalid_body" };
    const data = body as Record<string, unknown>;

    const username = typeof data.username === "string" ? data.username.trim() : "";
    if (username.length < 3 || username.length > 30) return { ok: false, error: "invalid_username" };

    const country = typeof data.country === "string" ? data.country.trim() : "";
    if (country.length < 2 || country.length > 60) return { ok: false, error: "invalid_country" };

    return { ok: true, value: { username, country } };
}

export type AvatarValidation =
    | { ok: true; value: string }
    | { ok: false; error: string };

const AVATAR_PREFIX = "data:image/jpeg;base64,";
const MAX_AVATAR_LENGTH = 90000;

export function validateAvatar(body: unknown): AvatarValidation {
    if (typeof body !== "object" || body === null) return { ok: false, error: "invalid_body" };
    const image = (body as Record<string, unknown>).image;

    if (typeof image !== "string" || !image.startsWith(AVATAR_PREFIX)) return { ok: false, error: "invalid_image" };

    const data = image.slice(AVATAR_PREFIX.length);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || !data.startsWith("/9j/")) return { ok: false, error: "invalid_image" };

    if (image.length > MAX_AVATAR_LENGTH) return { ok: false, error: "image_too_large" };

    return { ok: true, value: image };
}