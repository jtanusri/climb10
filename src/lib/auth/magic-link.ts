import { getDb } from '../db';
import crypto from 'crypto';

const TOKEN_EXPIRY_MINUTES = 15;

export async function isEmailAllowed(email: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id FROM allowed_users WHERE LOWER(email) = LOWER(?)',
    args: [email.trim()],
  });
  return result.rows.length > 0;
}

export async function generateMagicLink(email: string): Promise<string> {
  const db = getDb();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await db.execute({
    sql: 'INSERT INTO magic_links (email, token, expires_at) VALUES (?, ?, ?)',
    args: [email.toLowerCase().trim(), token, expiresAt],
  });

  // Normalize app URL: strip trailing slash and any accidental path suffix
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const parsed = new URL(rawUrl);
  const appUrl = `${parsed.protocol}//${parsed.host}`;
  return `${appUrl}/api/auth/verify?token=${token}`;
}

export async function verifyMagicLink(token: string): Promise<string | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT email, expires_at, used FROM magic_links WHERE token = ?',
    args: [token],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  if (row.used) return null;

  const expiresAt = new Date(row.expires_at as string);
  if (expiresAt < new Date()) return null;

  // Mark as used atomically
  await db.execute({
    sql: 'UPDATE magic_links SET used = 1 WHERE token = ? AND used = 0',
    args: [token],
  });

  return row.email as string;
}
