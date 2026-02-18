import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { envServer } from "@/lib/env/server";

export function getAnthropicClient() {
  if (!envServer.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: envServer.ANTHROPIC_API_KEY });
}

