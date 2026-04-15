import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set.');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendMagicLinkEmail(email: string, magicLink: string) {
  const resend = getResend();

  await resend.emails.send({
    from: 'Climb10 <onboarding@resend.dev>',
    to: email,
    subject: 'Sign in to Climb10',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #4a1d6a; font-size: 24px; margin: 0;">Climb10</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Nature Advisory Platform</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Click the button below to sign in to your account.</p>
          <a href="${magicLink}"
             style="display: inline-block; background: #4a1d6a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Sign In
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}
