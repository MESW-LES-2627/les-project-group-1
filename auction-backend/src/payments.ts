import type { Request, Response } from "express";
import { stripe } from "./stripe";
import { sendEmail } from "./email";
import { markPaid } from "./winners";

/**
 * Stripe Payment Service
 * 
 * Provides functions to create Stripe payment links and handle Stripe webhook events.
 */

//Generates a hosted Sprite Checkout session for the auction winner.
export async function createPaymentLink(
  itemName: string,
  amountEuros: number,
  email?: string,
) {
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
    success_url: `${process.env.FRONTEND_URL}/?paid=1`,
    cancel_url: `${process.env.FRONTEND_URL}/`,
  });
  return { id: session.id, url: session.url! };
}


//Listens for completed checkout events to mark bids as paid and send confirmation emails to the winners.
export async function stripeWebhook(req: Request, res: Response) {
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      req.body,
      req.headers["stripe-signature"] as string,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook error:", (err as Error).message);
    return res.status(400).send("invalid signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await markPaid(session.id);
      console.log(`Payment received for session ${session.id}`);
      const email = session.customer_details?.email;
      if (email) {
        await sendEmail(
          email,
          "Payment received",
          `<p>We received your payment of ${(session.amount_total ?? 0) / 100} €. Thank you!</p>`,
        ).catch((err) => console.error("Could not send confirmation email:", err));
      }
    }
  }

  res.json({ received: true });
}