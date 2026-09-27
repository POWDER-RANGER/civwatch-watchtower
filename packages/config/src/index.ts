import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://civwatch:changeme@localhost:5432/civwatch"),
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Parsed, validated process env. Throws on boot if invalid. */
export const env: Env = envSchema.parse(process.env);

export { envSchema };
