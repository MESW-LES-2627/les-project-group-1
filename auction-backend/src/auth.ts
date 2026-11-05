import type {Request, Response} from "express";
import {sql} from "./db";
import crypto  from 'crypto';
import {sendEmail} from "./email";
import { createSession } from "./session";

/*
* Authentication Service
* Provides functions to handle user registration, login, logout and password recovery.
*/

/*****************
 * REGISTRATION: *
 *****************/
// Register a new user with email and a hashed password.
export async function registerUser(req: Request, res: Response){
    try{
        const {username, email, password, country} = req.body;

        if(!username || !email || !password || !country) return res.status(400).json({error: "Username, email, password and country are required."});
        if(password.length < 8) return res.status(400).json({error: "Password must be at least 8 characters long."});

        const existsUser = await sql`select id from users where email = ${email}`;
        if(existsUser.length > 0) return res.status(400).json({error: "User already exists."});

        const hashedPassword = await Bun.password.hash(password, {algorithm: "argon2id"});

        const info = await sql`
            insert into users (username,email, password_hash, country)
            values (${username}, ${email}, ${hashedPassword}, ${country})
            returning id, username, email, created_at, country`;
        const newUser = info[0];
        const token = await createSession(newUser.id);

        return res.status(201).json({message: "User registered successfully.", 
            token,
            user: { 
                username: newUser.username,
                email: newUser.email,
                created_at: newUser.created_at,
                country: newUser.country,
            },
        });
    } catch (error){
        console.error("Registration error:", (error as Error).message);
        return res.status(500).json({error: "Internal server error."});
    }
}

/*****************
 *     LOGIN:    *
 *****************/
// Authenticate a user by verifying their email and password.
export async function loginUser(req: Request, res: Response){
    try{
        const {email, password} = req.body;
        if(!email || !password) return res.status(400).json({error: "Email and password are required."});

        const userData = await sql`select id, username, email, password_hash, country from users where email = ${email}`;
        if(userData.length === 0) return res.status(401).json({error: "Invalid credentials."});
        const user = userData[0];

        const isPasswordValid = await Bun.password.verify(password, user.password_hash);
        if(!isPasswordValid) return res.status(401).json({error: "Invalid credentials."});

        const token = await createSession(user.id);

        return res.status(200).json({message: "Login successful.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                country: user.country
            }
        });
    } catch (error){
        console.error("Login error:", (error as Error).message);
        return res.status(500).json({error: "Internal server error."});
    }
}

/***********************
 *   PASSWORD RESET:   *
 ***********************/

// Handle password reset requests by generating a secure token and sending a reset link to the user's email.
export async function forgotPassword(req: Request, res: Response){
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required." });

        const user = await sql`SELECT id FROM users WHERE lower(email) = lower(${email})`;
        if (user.length === 0) return res.status(200).json({ message: "If the email exists, a reset link has been sent." });

        // Generate a secure token and set an expiration time (15 minutes)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Store the token and its expiration in the database
        await sql`
            UPDATE users 
            SET reset_token = ${resetToken}, reset_token_expires = ${expiresAt} 
            WHERE lower(email) = lower(${email})
        `;

        // Construct the reset link and send it via email
        const resetLink = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password?token=${resetToken}`;
        
        try {
            await sendEmail(
                email,
                'Reset your password',
                `<p>Click the link below to set a new password:</p><a href="${resetLink}">Reset Password</a><p>This link expires in 15 minutes.</p>`
            );
        } catch (emailError) {
            console.warn("Email send skipped/failed (Resend restriction):", (emailError as Error).message);
        }

        return res.status(200).json({ message: "If the email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}

// Handle the actual password reset by validating the token and updating the user's password in the database.
export async function resetPassword(req: Request, res: Response){
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required." });
        if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters long." });
        
        // Check if the token is valid and not expired
        const user = await sql`
            SELECT id FROM users 
            WHERE reset_token = ${token} 
            AND reset_token_expires > NOW()
        `;

        if (user.length === 0) return res.status(400).json({ error: "Invalid or expired reset token." });

        // Hash the new password and update the user's record
        const passwordHash = await Bun.password.hash(newPassword, { algorithm: "argon2id" });

        // Update the user's password and clear the reset token and its expiration
        await sql`
            UPDATE users 
            SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL 
            WHERE id = ${user[0].id}
        `;

        return res.status(200).json({ message: "Password has been successfully reset." });
    } catch (error) {
        console.error("Reset password error:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error." });
    }
}