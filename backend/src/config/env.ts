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
  SUPERADMIN_PASSWORD: z.string().min(8).optional()
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  DAKSHORA_SUPER_ADMIN_EMAIL: parsed.DAKSHORA_SUPER_ADMIN_EMAIL || parsed.SUPERADMIN_EMAIL,
  DAKSHORA_SUPER_ADMIN_PASSWORD: parsed.DAKSHORA_SUPER_ADMIN_PASSWORD || parsed.SUPERADMIN_PASSWORD
};