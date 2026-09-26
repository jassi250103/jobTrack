import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const makeHtml = ({ title, otp, expiryMinutes, accent, message }) => `
  <div style="font-family: Arial, sans-serif; background:#f5f7f3; padding:32px; color:#17251d;">
    <div style="max-width:560px; margin:0 auto; background:white; border:1px solid #e6ece7; border-radius:18px; overflow:hidden;">
      <div style="background:#163f32; color:white; padding:20px 24px; font-weight:700; letter-spacing:0.06em; font-size:12px; text-transform:uppercase;">
        JobTrack
      </div>
      <div style="padding:28px 24px 20px;">
        <h2 style="margin:0 0 12px; font-size:28px; color:#12251d;">${title}</h2>
        <p style="margin:0 0 18px; color:#4d5d57; line-height:1.6;">${message}</p>
        <div style="background:#edf7f0; border:1px solid #d8eadb; border-radius:12px; padding:20px; text-align:center; margin: 20px 0;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.12em; color:#3c6754; text-transform:uppercase; margin-bottom:10px;">Verification code</div>
          <div style="font-size:36px; letter-spacing:8px; font-weight:700; color:${accent};">${otp}</div>
        </div>
        <p style="margin:0; color:#4d5d57; line-height:1.6;">This code expires in ${expiryMinutes} minutes. Never share it with anyone.</p>
      </div>
    </div>
  </div>
`;

const buildTransport = () => {
  if (!env.emailHost) return null;
  return nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: env.emailUser && env.emailPassword ? { user: env.emailUser, pass: env.emailPassword } : undefined,
  });
};

export async function sendVerificationOTP({ email, otp }) {
  const transport = buildTransport();
  const html = makeHtml({
    title: 'Verify your JobTrack account',
    otp,
    expiryMinutes: 5,
    accent: '#163f32',
    message: 'Use the code below to complete your email verification and unlock your JobTrack workspace.',
  });

  if (!transport) {
    throw new AppError(503, 'Email delivery is not configured. Please contact support.');
  }

  await transport.sendMail({
    from: env.emailFrom,
    to: email,
    subject: 'Verify your JobTrack account',
    html,
  });
}

export async function sendPasswordResetOTP({ email, otp }) {
  const transport = buildTransport();
  const html = makeHtml({
    title: 'Reset your JobTrack password',
    otp,
    expiryMinutes: 5,
    accent: '#7b2d1f',
    message: 'We received a request to reset your JobTrack password. Use the code below to create a new password.',
  });

  if (!transport) {
    throw new AppError(503, 'Email delivery is not configured. Please contact support.');
  }

  await transport.sendMail({
    from: env.emailFrom,
    to: email,
    subject: 'Reset your JobTrack password',
    html,
  });
}
