import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { verifyMagicLink } from '@/lib/auth/magic-link';
import { setSessionCookieOnResponse } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    await ensureMigrations();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    const email = await verifyMagicLink(token);
    if (!email) {
      return NextResponse.redirect(new URL('/login?error=invalid_or_expired', request.url));
    }

    // Create the redirect response and attach the session cookie directly.
    // (cookies().set() inside a route handler does NOT reliably attach to a
    // NextResponse.redirect(), so we set it on the response object instead.)
    const response = NextResponse.redirect(new URL('/', request.url));
    await setSessionCookieOnResponse(response, email);
    return response;
  } catch (error) {
    console.error('[auth/verify] Error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
