import Stripe from "stripe";
import { env } from "../config/env";

export const stripe = new Stripe(env.stripeSecretKey);

/** Creates a hosted Stripe Checkout session for the auction winner. */
export async function createPaymentLink(itemName: string, amountEuros: number, email?: string) {
  const session = await stripe.checkout.sessions.create({
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
