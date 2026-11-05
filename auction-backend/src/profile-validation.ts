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