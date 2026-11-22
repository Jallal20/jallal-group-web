import "server-only";

// Patch undici's fetch before node-appwrite loads it (Cloudflare Workers
// does not support the ALPNProtocols option that undici passes by default).
import "@/lib/undici-fetch-patch";

import { Client, TablesDB, Account, Models } from "node-appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";

function baseClient(): Client {
  return new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId);
}

/** Server-only client authenticated with the Appwrite API key (admin scope). */
export function adminClient(): Client {
  if (!isAppwriteConfigured()) {
    throw new Error(
      "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_* and APPWRITE_API_KEY in the environment.",
    );
  }

  return baseClient().setKey(env.apiKey);
}

export function adminTablesDB(): TablesDB {
  return new TablesDB(adminClient());
}

/** Client used to verify an admin browser session (session secret header). */
export function sessionClient(sessionSecret: string): Client {
  return baseClient().setSession(sessionSecret);
}

export function sessionAccount(sessionSecret: string): Account {
  return new Account(sessionClient(sessionSecret));
}

export type { Models };
