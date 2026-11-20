import Stripe from "stripe";
import { env } from "../config/env";

// Created on first use, so importing the app (for example in tests) does not
// require STRIPE_SECRET_KEY to be set.
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!env.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set.");
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

/** Creates a hosted Stripe Checkout session for the auction winner. */
export async function createPaymentLink(itemName: string, amountEuros: number, email?: string) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(amountEuros * 100),
          product_data: { name: itemName },
        },
      },
    ],
    success_url: `${env.frontendUrl}/?paid=1`,
    cancel_url: `${env.frontendUrl}/`,
  });
  return { id: session.id, url: session.url! };
}
