import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  DAKSHORA_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  DAKSHORA_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  SUPERADMIN_PASSWORD: z.string().min(8).optional(),

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // SMS Gateway (Fast2SMS & Twilio)
  FAST2SMS_API_KEY: z.string().optional(),
  FAST2SMS_SENDER_ID: z.string().default("DKSHRA"),
  FAST2SMS_ENTITY_ID: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_STATUS_CALLBACK: z.string().optional(),

  // WhatsApp Gateway (Gupshup)
  GUPSHUP_API_KEY: z.string().optional(),
  GUPSHUP_APP_NAME: z.string().default("DakshoraERP"),
  GUPSHUP_SOURCE_NUMBER: z.string().optional(),

  // SMTP Email Relay
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Dakshora ERP <no-reply@dakshora.co.in>"),
  SMTP_SECURE: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false)
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  DAKSHORA_SUPER_ADMIN_EMAIL: parsed.DAKSHORA_SUPER_ADMIN_EMAIL || parsed.SUPERADMIN_EMAIL,
  DAKSHORA_SUPER_ADMIN_PASSWORD: parsed.DAKSHORA_SUPER_ADMIN_PASSWORD || parsed.SUPERADMIN_PASSWORD
};