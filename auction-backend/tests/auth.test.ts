import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { httpServer } from "../index"; 
import {sql} from "../src/db";

const PORT = 3001; // diffent port for testing to avoid conflicts with the main server
const BASE_URL = `http://localhost:${PORT}`;

// Clean up the users table before and after tests
beforeAll(async () => {
  if (!httpServer.listening) {
    httpServer.listen(PORT);
  }
  await sql`DELETE FROM users;`;
});

// CLose the server after all tests
afterAll(async () => {
  httpServer.close();
});

/*****************
 * REGISTRATION: *
 *****************/

describe("POST /api/auth/register", () => {
  
  it("should successfully register a new user with valid data", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        email: "test@feup.pt",
        password: "securepassword123",
        country: "PT",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("User registered successfully.");
    expect(data.user.email).toBe("test@feup.pt");
    expect(data.user.username).toBe("testuser");
    expect(data.user.country).toBe("PT");
    expect(data.user.password_hash).toBeUndefined(); 
  });

  it("should fail if required fields are missing", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "incomplete@feup.pt",
        password: "securepassword123",
        // Username is missing
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Username, email, password and country are required.");
  });

  it("should fail if password is less than 8 characters", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "shortpassuser",
        email: "short@feup.pt",
        password: "123", // <8
        country: "PT",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Password must be at least 8 characters long.");
  });

  it("should reject duplicate email registrations", async () => {
    // Tries to register the same email again
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "anotheruser",
        email: "test@feup.pt", // email aldeady registered in the first test
        password: "securepassword123",
        country: "PT",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User already exists.");
  });

});

/*****************
 *     LOGIN:    *
 *****************/

describe("POST /api/auth/login", () => {
  
  it("should successfully log in with valid credentials", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@feup.pt", // email registered in the registration test
        password: "securepassword123",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Login successful.");
    expect(data.user.email).toBe("test@feup.pt");
    expect(data.user.country).toBe("PT");
  });

  it("should fail with incorrect password", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@feup.pt",
        password: "wrongpassword",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid credentials.");
  });

  it("should fail if email does not exist", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@feup.pt",
        password: "securepassword123",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid credentials.");
  });

});

/*****************
*    LOGOUT:    *
*****************/

describe("POST /api/auth/logout", () => {
  
  it("should successfully log out and terminate session", async () => {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@feup.pt", // email aldeady registered in the first test
        password: "securepassword123",
      }),
    });
    expect(loginResponse.status).toBe(200);

    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.message).toBe("Logged out successfully.");
  });
});

/*****************
- PASSWORD RESET: *
 *****************/

describe("POST /api/auth/forgot-password & /api/auth/reset-password", () => {
  
  it("should request password reset successfully for existing email", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@feup.pt" }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.message).toBe("If the email exists, a reset link has been sent.");
  });

  it("should fail to reset password if token is invalid or expired", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: "fake-invalid-token-12345", 
        newPassword: "newsecurepassword123" 
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid or expired reset token.");
  });

  it("should fail to reset password if new password is less than 8 characters", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: "some-token", 
        newPassword: "short" 
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Password must be at least 8 characters long.");
  });

});