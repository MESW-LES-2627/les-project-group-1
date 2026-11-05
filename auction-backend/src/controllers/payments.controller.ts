import type { Request, Response } from "express";
import { env } from "../config/env";
import { stripe } from "../services/stripe.service";
import { sendEmail } from "../services/email.service";
import { markPaid } from "../models/winner.model";

/** Stripe webhook: marks winners as paid and sends a confirmation email. */
export async function stripeWebhook(req: Request, res: Response) {
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      req.body,
      req.headers["stripe-signature"] as string,
      env.stripeWebhookSecret,
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
