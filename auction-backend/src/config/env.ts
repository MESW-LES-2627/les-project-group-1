/** Central place for environment variables (Bun loads .env automatically). */
export const env = {
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM!,
};
