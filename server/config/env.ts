import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });
loadEnv();

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
  SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(32, "SESSION_SECRET must be at least 32 characters.").default("dev-session-secret-change-me-32chars")
  ),
  PHONE_HMAC_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(32, "PHONE_HMAC_KEY must be at least 32 characters.").default("dev-phone-hmac-key-change-me-32chars")
  ),
  AUTH_PASSWORD_PEPPER: z.preprocess(
    emptyToUndefined,
    z.string().min(16, "AUTH_PASSWORD_PEPPER must be at least 16 characters.").default("dev-pepper-16chars")
  ),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  APP_BASE_URL: z.string().url().default("http://localhost:8080"),
  EMAIL_PROVIDER: z.enum(["resend", "postmark", "none"]).default("none"),
  EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().email().optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  POSTMARK_SERVER_TOKEN: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  CRON_ENABLED: z.preprocess(emptyToUndefined, z.enum(["true", "false"]).optional()),
  CRON_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  TWILIO_ACCOUNT_SID: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^AC[a-zA-Z0-9]{32}$/, "TWILIO_ACCOUNT_SID must start with AC and be 34 characters.").optional()
  ),
  TWILIO_AUTH_TOKEN: z.preprocess(emptyToUndefined, z.string().min(32, "TWILIO_AUTH_TOKEN must be at least 32 characters.").optional()),
  TWILIO_VERIFY_SERVICE_SID: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^VA[a-zA-Z0-9]{32}$/, "TWILIO_VERIFY_SERVICE_SID must start with VA and be 34 characters.").optional()
  ),
  AI_ASSISTANT_ENABLED: z.preprocess(emptyToUndefined, z.enum(["true", "false"]).optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  OPENAI_MODEL: z.string().min(3).default("gpt-4o-mini"),
  ADMIN_USERNAMES: z.preprocess(emptyToUndefined, z.string().optional()),
  SIGNUP_INVITE_ONLY: z.preprocess(emptyToUndefined, z.enum(["true", "false"]).optional()),
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("[startup] Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
