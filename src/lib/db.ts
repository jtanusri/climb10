import { createClient, type Client } from '@libsql/client';
import { runMigrations } from './db/migrations';

let client: Client | null = null;
let migrated = false;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function ensureMigrations(): Promise<void> {
  if (migrated) return;
  await runMigrations(getDb());
  migrated = true;
}
