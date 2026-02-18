import "server-only";
import { z } from "zod";

const ServerEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
});

export const envServer = ServerEnvSchema.parse({
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
});

