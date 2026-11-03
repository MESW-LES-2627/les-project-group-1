import type {Request, Response} from "express";
import {sql} from "./db";

/*
* Authentication Service
* Provides functions to handle user registration and credemtial management.
*/

/*****************
 * REGISTRATION: *
 *****************/
// Register a new user with email and a hashed password.
export async function registerUser(req: Request, res: Response){
    try{
        const {username, email, password} = req.body;

        if(!username || !email || !password) return res.status(400).json({error: "Username, email and password are required."});
        if(password.length < 8) return res.status(400).json({error: "Password must be at least 8 characters long."});

        const existsUser = await sql`select id from users where email = ${email}`;
        if(existsUser.length > 0) return res.status(400).json({error: "User already exists."});

        const hashedPassword = await Bun.password.hash(password, {algorithm: "argon2id"});

        const info = await sql`
            insert into users (username,email, password_hash)
            values (${username}, ${email}, ${hashedPassword})
            returning username, email, created_at`;
        const newUser = info[0];

        return res.status(201).json({message: "User registered successfully.", 
            user: { 
                username: newUser.username,
                email: newUser.email,
                created_at: newUser.created_at
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

        const userData = await sql`select id, username, email, password_hash from users where email = ${email}`;
        if(userData.length === 0) return res.status(401).json({error: "Invalid credentials."});
        const user = userData[0];

        const isPasswordValid = await Bun.password.verify(password, user.password_hash);
        if(!isPasswordValid) return res.status(401).json({error: "Invalid credentials."});

        return res.status(200).json({message: "Login successful.",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error){
        console.error("Login error:", (error as Error).message);
        return res.status(500).json({error: "Internal server error."});
    }
}