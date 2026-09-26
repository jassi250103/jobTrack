import { AppError } from './app-error.js';

export const statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
export const interviewTypes = ['PHONE', 'VIDEO', 'ONSITE', 'OTHER'];
export const interviewResults = ['PENDING', 'PASSED', 'FAILED', 'CANCELLED'];

export function requireFields(body, fields) {
  const absent = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (absent.length) throw new AppError(400, `Missing required field(s): ${absent.join(', ')}`);
}

export function assertAllowed(value, allowed, field) {
  if (value !== undefined && !allowed.includes(value)) throw new AppError(400, `Invalid ${field}.`);
}

export function assertId(value, label = 'id') {
  if (!Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new AppError(400, `Invalid ${label}.`);
  return Number(value);
}

export function assertEmail(email) {
  if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'A valid email is required.');
}

export function assertString(value, field, { min = 1, max = 2048 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new AppError(400, `Invalid ${field}.`);
}

export function assertDate(value, field) {
  if (value === undefined || value === null) return;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new AppError(400, `Invalid ${field}. Use YYYY-MM-DD.`);
}

export function assertUrl(value, field) {
  if (value === undefined || value === null || value === '') return;
  try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
  catch { throw new AppError(400, `Invalid ${field}.`); }
}

export function normalizeSalary(value) {
  if (value === undefined || value === null || value === '') return value;
  return String(value).trim().replace(/[₹,\s]/g, '');
}

export function assertSalary(value) {
  if (value === undefined || value === null || value === '') return;
  const normalized = normalizeSalary(value);
  if (!/^\d+(\.\d{1,2})?$/.test(normalized) || Number(normalized) < 0 || Number(normalized) > 1000000000) throw new AppError(400, 'Salary must be a non-negative numeric value.');
}

export function pagination(query) {
  const page = Number(query.page ?? 1); const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, 'page must be positive and limit must be between 1 and 100.');
  return { page, limit, offset: (page - 1) * limit };
}
