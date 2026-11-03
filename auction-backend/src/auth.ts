import type {Request, Response} from "express";
import {sql} from "./db";

/*
* Authentication Service
* Provides functions to handle user registration and credemtial management.
*/

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