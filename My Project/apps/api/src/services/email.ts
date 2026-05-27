import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env["SMTP_HOST"] ?? "localhost",
  port: parseInt(process.env["SMTP_PORT"] ?? "1025", 10),
  auth: process.env["SMTP_USER"]
    ? { user: process.env["SMTP_USER"], pass: process.env["SMTP_PASS"] }
    : undefined,
  secure: false,
});

const FROM = process.env["SMTP_FROM"] ?? "noreply@flowforge.dev";
const APP_URL = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, userId: string): Promise<void> {
  const token = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString("base64url");
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your FlowForge email",
    html: `
      <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111;">Verify your email</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">Click the button below to verify your email address.</p>
        <a href="${APP_URL}/api/auth/verify?token=${token}"
           style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, userId: string): Promise<void> {
  const token = Buffer.from(JSON.stringify({ userId, type: "reset", exp: Date.now() + 3600000 })).toString("base64url");
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your FlowForge password",
    html: `
      <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111;">Reset your password</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${APP_URL}/reset?token=${token}"
           style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWorkspaceInviteEmail(email: string, inviteToken: string, workspaceName: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to ${workspaceName} on FlowForge`,
    html: `
      <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111;">Workspace invitation</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">You've been invited to join <strong>${workspaceName}</strong> on FlowForge.</p>
        <a href="${APP_URL}/invite?token=${inviteToken}"
           style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
          Accept Invitation
        </a>
      </div>
    `,
  });
}
