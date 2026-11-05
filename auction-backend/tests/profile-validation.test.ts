import { describe, it, expect } from "bun:test";
import { validateProfileInput } from "../src/profile-validation";

describe("validateProfileInput", () => {
  it("accepts a valid username and country", () => {
    expect(validateProfileInput({ username: "Afonso_23", country: "PT" })).toEqual({
      ok: true,
      value: { username: "Afonso_23", country: "PT" },
    });
  });

  it("trims whitespace", () => {
    expect(validateProfileInput({ username: "  afonso  ", country: " PT " })).toEqual({
      ok: true,
      value: { username: "afonso", country: "PT" },
    });
  });

  it("rejects a non-object body", () => {
    expect(validateProfileInput(null)).toEqual({ ok: false, error: "invalid_body" });
    expect(validateProfileInput("x")).toEqual({ ok: false, error: "invalid_body" });
  });

  it("rejects usernames that are too short, too long or missing", () => {
    expect(validateProfileInput({ username: "ab", country: "PT" })).toEqual({
      ok: false,
      error: "invalid_username",
    });
    expect(validateProfileInput({ username: "x".repeat(31), country: "PT" })).toEqual({
      ok: false,
      error: "invalid_username",
    });
    expect(validateProfileInput({ country: "PT" })).toEqual({ ok: false, error: "invalid_username" });
  });

  it("rejects countries that are too short, too long or missing", () => {
    expect(validateProfileInput({ username: "afonso", country: "P" })).toEqual({
      ok: false,
      error: "invalid_country",
    });
    expect(validateProfileInput({ username: "afonso", country: "x".repeat(61) })).toEqual({
      ok: false,
      error: "invalid_country",
    });
    expect(validateProfileInput({ username: "afonso" })).toEqual({ ok: false, error: "invalid_country" });
  });
});