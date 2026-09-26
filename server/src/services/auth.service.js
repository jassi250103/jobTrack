import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { sendPasswordResetOTP, sendVerificationOTP } from './email.service.js';

const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  emailVerified: Boolean(row.email_verified),
  authProvider: row.auth_provider || 'EMAIL',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();
const generateOtp = () => crypto.randomInt(100000, 1000000).toString().padStart(6, '0');
const otpHash = (otp) => bcrypt.hash(otp, 10);
const tokenFor = (user) => jwt.sign({ sub: user.id, email: user.email, provider: user.auth_provider || 'EMAIL' }, env.jwtSecret, { expiresIn: env.jwtExpiresIn || '7d' });

async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function invalidateActiveVerifications(email, purpose) {
  await pool.query('UPDATE email_verifications SET active = false WHERE email = $1 AND purpose = $2 AND active = true', [email, purpose]);
}

async function createVerificationRecord({ email, purpose, userId }) {
  await invalidateActiveVerifications(email, purpose);
  const otp = generateOtp();
  const hashed = await otpHash(otp);
  const { rows } = await pool.query(
    `INSERT INTO email_verifications (user_id, email, otp_hash, purpose, expires_at, created_at, attempts, active)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes', NOW(), 0, true)
     RETURNING *`,
    [userId ?? null, email, hashed, purpose]
  );

  if (purpose === 'REGISTRATION') {
    await sendVerificationOTP({ email, otp });
  } else {
    await sendPasswordResetOTP({ email, otp });
  }

  return { ...rows[0], otp };
}

async function verifyOtpRecord({ email, otp, purpose, consume = true, requireVerified = false }) {
  const normalizedEmail = normalizeEmail(email);
  const { rows } = await pool.query(
    `SELECT * FROM email_verifications
     WHERE email = $1 AND purpose = $2 AND active = true
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail, purpose]
  );

  const record = rows[0];
  if (!record) throw new AppError(401, 'Invalid or expired verification code.');
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await pool.query('UPDATE email_verifications SET active = false WHERE id = $1', [record.id]);
    throw new AppError(401, 'This verification code has expired. Please request a fresh one.');
  }

  if (Number(record.attempts) >= 5) {
    await pool.query('UPDATE email_verifications SET active = false WHERE id = $1', [record.id]);
    throw new AppError(401, 'Too many incorrect attempts. Please request a new code.');
  }

  if (requireVerified && !record.verified_at) {
    throw new AppError(401, 'Verify the reset code before choosing a new password.');
  }

  const isValid = await bcrypt.compare(String(otp).trim(), record.otp_hash);
  if (!isValid) {
    const nextAttempts = Number(record.attempts) + 1;
    await pool.query('UPDATE email_verifications SET attempts = $1 WHERE id = $2', [nextAttempts, record.id]);
    if (nextAttempts >= 5) {
      await pool.query('UPDATE email_verifications SET active = false WHERE id = $1', [record.id]);
    }
    throw new AppError(401, 'Incorrect verification code.');
  }

  if (consume) {
    await pool.query('UPDATE email_verifications SET active = false, used_at = NOW() WHERE id = $1', [record.id]);
  } else {
    await pool.query('UPDATE email_verifications SET verified_at = NOW() WHERE id = $1', [record.id]);
  }
  return record;
}

function assertStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new AppError(400, 'Password must be 8 to 128 characters long.');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError(400, 'Password must include an uppercase letter, lowercase letter, and number.');
  }
}

export async function register({ name, email, password, confirmPassword }) {
  const normalizedEmail = normalizeEmail(email);
  if (!name || String(name).trim().length < 2) throw new AppError(400, 'Please enter your full name.');
  if (!normalizedEmail) throw new AppError(400, 'A valid email is required.');
  assertStrongPassword(password);
  if (password !== confirmPassword) throw new AppError(400, 'Passwords do not match.');

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser && existingUser.email_verified) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = existingUser
    ? await pool.query(
        'UPDATE users SET name = $1, password_hash = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [String(name).trim(), passwordHash, existingUser.id]
      )
    : await pool.query(
        'INSERT INTO users (name, email, password_hash, email_verified, auth_provider) VALUES ($1, $2, $3, false, $4) RETURNING *',
        [String(name).trim(), normalizedEmail, passwordHash, 'EMAIL']
      );

  const user = rows[0];
  await createVerificationRecord({ email: normalizedEmail, purpose: 'REGISTRATION', userId: user.id });

  return {
    user: publicUser(user),
    requiresVerification: true,
    message: 'Verify your email',
  };
}

export async function verifyRegistration({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (!user) throw new AppError(404, 'We could not find that registration.');

  await verifyOtpRecord({ email: normalizedEmail, otp, purpose: 'REGISTRATION' });
  const { rows } = await pool.query(
    'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1 RETURNING *',
    [user.id]
  );

  const verifiedUser = rows[0];
  return { user: publicUser(verifiedUser), token: tokenFor(verifiedUser) };
}

export async function resendRegistrationOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (!user) return { message: 'If that email is registered, a fresh code will be sent.' };
  if (user.email_verified) throw new AppError(409, 'This account is already verified.');

  const record = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1', [normalizedEmail, 'REGISTRATION']);
  const last = record.rows[0];
  if (last && new Date(last.created_at).getTime() > Date.now() - 60000) {
    throw new AppError(429, 'Please wait a minute before requesting another code.');
  }

  await createVerificationRecord({ email: normalizedEmail, purpose: 'REGISTRATION', userId: user.id });
  return { message: 'A fresh verification code has been sent.' };
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (!user || !user.password_hash) throw new AppError(401, 'Invalid email or password.');
  if (!user.email_verified) {
    throw new AppError(403, 'Please verify your email before logging in.', { requiresVerification: true, email: normalizedEmail });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new AppError(401, 'Invalid email or password.');
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function googleLogin({ credential }) {
  if (!env.googleClientId) throw new AppError(503, 'Google sign-in is not configured on this server.');
  const client = new OAuth2Client(env.googleClientId);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new AppError(401, 'Google authentication failed.');
  }

  const normalizedEmail = normalizeEmail(payload.email);
  let user = await getUserByEmail(normalizedEmail);

  if (!user) {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, email_verified, auth_provider, google_id) VALUES ($1, $2, $3, true, $4, $5) RETURNING *',
      [payload.name || normalizedEmail.split('@')[0], normalizedEmail, null, 'GOOGLE', payload.sub]
    );
    user = rows[0];
  } else {
    if (user.google_id && user.google_id !== payload.sub && user.auth_provider === 'GOOGLE') {
      throw new AppError(409, 'This Google account is already linked to a different JobTrack user.');
    }

    const { rows } = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email_verified = true, auth_provider = $2, google_id = COALESCE(google_id, $3), updated_at = NOW() WHERE id = $4 RETURNING *',
      [payload.name || user.name, 'GOOGLE', payload.sub, user.id]
    );
    user = rows[0];
  }

  return { user: publicUser(user), token: tokenFor(user) };
}

export async function forgotPassword({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (user) {
    await createVerificationRecord({ email: normalizedEmail, purpose: 'RESET', userId: user.id });
  }
  return { message: 'If that account exists, a reset code has been sent.' };
}

export async function verifyResetOtp({ email, otp }) {
  await verifyOtpRecord({ email, otp, purpose: 'RESET', consume: false });
  return { success: true, message: 'Code verified.' };
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (!user) throw new AppError(404, 'We could not find that account.');
  assertStrongPassword(password);
  if (password !== confirmPassword) throw new AppError(400, 'Passwords do not match.');

  await verifyOtpRecord({ email: normalizedEmail, otp, purpose: 'RESET', requireVerified: true });
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, user.id]);
  await invalidateActiveVerifications(normalizedEmail, 'RESET');
  return { success: true, message: 'Your password has been reset successfully.' };
}

export async function resendResetOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);
  if (!user) return { message: 'If that account exists, a reset code has been sent.' };

  const { rows } = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1', [normalizedEmail, 'RESET']);
  const last = rows[0];
  if (last && new Date(last.created_at).getTime() > Date.now() - 60000) {
    throw new AppError(429, 'Please wait a minute before requesting another code.');
  }

  await createVerificationRecord({ email: normalizedEmail, purpose: 'RESET', userId: user.id });
  return { message: 'A fresh reset code has been sent.' };
}

export async function getMe(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw new AppError(401, 'User account no longer exists.');
  return publicUser(rows[0]);
}

export async function logout() {
  return { success: true };
}
