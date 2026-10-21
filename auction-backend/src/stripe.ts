import Stripe from "stripe";

/**
 * Stripe SDK Client
 * 
 * Initializes the Stripe client using the STRIPE_SECRET_KEY environment variable. 
 */

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);