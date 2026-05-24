import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
  }
  return _resend;
}

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@adcreative.ai';

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) { console.warn('[Email] RESEND_API_KEY not set, skipping email'); return; }
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your password — AdCreative AI',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="font-size:24px;font-weight:700;margin-bottom:8px">Reset your password</h2>
        <p style="color:#64748b;margin-bottom:24px">
          Click the button below to reset your AdCreative AI password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) { console.warn('[Email] RESEND_API_KEY not set, skipping email'); return; }
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to AdCreative AI 🎨',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="font-size:24px;font-weight:700;margin-bottom:8px">Welcome, ${name}!</h2>
        <p style="color:#64748b;margin-bottom:16px">
          You've got <strong>10 free credits</strong> to get started generating AI-powered ad creatives.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

