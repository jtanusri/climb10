import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { isEmailAllowed, generateMagicLink } from '@/lib/auth/magic-link';
import { sendMagicLinkEmail } from '@/lib/auth/send-email';

export async function POST(request: Request) {
  try {
    await ensureMigrations();

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const trimmed = email.toLowerCase().trim();

    // Check whitelist
    const allowed = await isEmailAllowed(trimmed);
    if (!allowed) {
      // Don't reveal whether email is whitelisted — always show success message
      return NextResponse.json({ success: true, message: 'If your email is authorized, you will receive a login link shortly.' });
    }

    // Generate magic link and send email
    const magicLink = await generateMagicLink(trimmed);
    await sendMagicLinkEmail(trimmed, magicLink);

    return NextResponse.json({ success: true, message: 'If your email is authorized, you will receive a login link shortly.' });
  } catch (error) {
    console.error('[auth/login] Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
