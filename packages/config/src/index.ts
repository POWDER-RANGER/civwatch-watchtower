import { z } from "zod";

const DEV_DATABASE_URL =
  "postgresql://civwatch:changeme@localhost:5432/civwatch";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required").optional(),
    REDIS_URL: z.string().optional(),
  })
  .transform((raw) => {
    const databaseUrl =
      raw.DATABASE_URL ??
      (raw.NODE_ENV === "production" ? undefined : DEV_DATABASE_URL);

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is required when NODE_ENV=production (no localhost default)",
      );
    }

    return {
      NODE_ENV: raw.NODE_ENV,
      PORT: raw.PORT,
      DATABASE_URL: databaseUrl,
      REDIS_URL: raw.REDIS_URL,
    };
  });

export type Env = z.infer<typeof envSchema>;

/** Parsed, validated process env. Throws on boot if invalid. */
export const env: Env = envSchema.parse(process.env);

export { envSchema };
