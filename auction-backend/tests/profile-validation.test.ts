import { describe, it, expect } from "bun:test";
import { validateAvatar, validateProfileInput } from "../src/profile-validation";

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

describe("validateAvatar", () => {
  const valid = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";

  it("accepts a jpeg data url", () => {
    expect(validateAvatar({ image: valid })).toEqual({ ok: true, value: valid });
  });

  it("rejects a non-object body or a missing image", () => {
    expect(validateAvatar(null)).toEqual({ ok: false, error: "invalid_body" });
    expect(validateAvatar({})).toEqual({ ok: false, error: "invalid_image" });
  });

  it("rejects anything that is not a jpeg data url", () => {
    expect(validateAvatar({ image: "data:image/png;base64,/9j/4AAQ" })).toEqual({
      ok: false,
      error: "invalid_image",
    });
    expect(validateAvatar({ image: "data:image/svg+xml;base64,PHN2Zz4=" })).toEqual({
      ok: false,
      error: "invalid_image",
    });
    expect(validateAvatar({ image: "https://example.com/a.jpg" })).toEqual({
      ok: false,
      error: "invalid_image",
    });
  });

  it("rejects data that is not valid base64 or not a jpeg", () => {
    expect(validateAvatar({ image: "data:image/jpeg;base64,/9j/4AAQ<script>" })).toEqual({
      ok: false,
      error: "invalid_image",
    });
    expect(validateAvatar({ image: "data:image/jpeg;base64,iVBORw0KGgo=" })).toEqual({
      ok: false,
      error: "invalid_image",
    });
  });

  it("rejects images that are too large", () => {
    expect(validateAvatar({ image: "data:image/jpeg;base64,/9j/" + "A".repeat(90000) })).toEqual({
      ok: false,
      error: "image_too_large",
    });
  });
});