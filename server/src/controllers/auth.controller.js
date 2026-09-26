import * as auth from '../services/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { assertEmail, assertString, requireFields } from '../utils/validation.js';
import { AppError } from '../utils/app-error.js';

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password', 'confirmPassword']);
  assertString(req.body.name, 'name', { min: 2, max: 120 });
  assertEmail(req.body.email);
  assertString(req.body.password, 'password', { min: 8, max: 128 });
  assertString(req.body.confirmPassword, 'confirmPassword', { min: 8, max: 128 });
  res.status(201).json({ success: true, data: await auth.register(req.body) });
});

export const verifyRegistration = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'otp']);
  assertEmail(req.body.email);
  assertString(req.body.otp, 'otp', { min: 6, max: 6 });
  res.json({ success: true, data: await auth.verifyRegistration(req.body) });
});

export const resendRegistrationOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email']);
  assertEmail(req.body.email);
  res.json({ success: true, data: await auth.resendRegistrationOtp(req.body) });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  assertEmail(req.body.email);
  assertString(req.body.password, 'password', { min: 1, max: 128 });
  res.json({ success: true, data: await auth.login(req.body) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  requireFields(req.body, ['credential']);
  res.json({ success: true, data: await auth.googleLogin(req.body) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email']);
  assertEmail(req.body.email);
  res.json({ success: true, data: await auth.forgotPassword(req.body) });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'otp']);
  assertEmail(req.body.email);
  assertString(req.body.otp, 'otp', { min: 6, max: 6 });
  res.json({ success: true, data: await auth.verifyResetOtp(req.body) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'otp', 'password', 'confirmPassword']);
  assertEmail(req.body.email);
  assertString(req.body.otp, 'otp', { min: 6, max: 6 });
  assertString(req.body.password, 'password', { min: 8, max: 128 });
  assertString(req.body.confirmPassword, 'confirmPassword', { min: 8, max: 128 });
  res.json({ success: true, data: await auth.resetPassword(req.body) });
});

export const resendResetOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email']);
  assertEmail(req.body.email);
  res.json({ success: true, data: await auth.resendResetOtp(req.body) });
});

export const requestOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email']);
  assertEmail(req.body.email);
  const type = req.body.type || 'REGISTRATION';
  if (type === 'REGISTRATION') {
    res.json({ success: true, data: await auth.resendRegistrationOtp({ email: req.body.email }) });
    return;
  }
  if (type === 'RESET') {
    res.json({ success: true, data: await auth.resendResetOtp({ email: req.body.email }) });
    return;
  }
  throw new AppError(400, 'Invalid verification request type.');
});

export const verifyOtp = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'otp']);
  assertEmail(req.body.email);
  assertString(req.body.otp, 'otp', { min: 6, max: 6 });
  const type = req.body.type || 'REGISTRATION';
  if (type === 'RESET') {
    res.json({ success: true, data: await auth.verifyResetOtp(req.body) });
    return;
  }
  res.json({ success: true, data: await auth.verifyRegistration(req.body) });
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, data: await auth.getMe(req.user.sub) }));

export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await auth.logout() });
});
