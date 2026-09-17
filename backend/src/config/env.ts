import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const env = envSchema.parse(process.env);