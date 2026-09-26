import { pool } from '../db/pool.js';
import { AppError } from '../utils/app-error.js';

const fields = ['name', 'website', 'location', 'industry'];
export const list = async (userId) => (await pool.query('SELECT * FROM companies WHERE user_id = $1 ORDER BY name ASC', [userId])).rows;
export async function get(id, userId) {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rows[0]) throw new AppError(404, 'Company not found.'); return rows[0];
}
export async function create(body, userId) {
  const values = fields.map((f) => body[f] ?? null);
  const { rows } = await pool.query('INSERT INTO companies (user_id, name, website, location, industry) VALUES ($1,$2,$3,$4,$5) RETURNING *', [userId, ...values]); return rows[0];
}
export async function update(id, body, userId) {
  const changed = fields.filter((field) => body[field] !== undefined);
  if (!changed.length) throw new AppError(400, 'No fields supplied for update.');
  const values = changed.map((field) => body[field]);
  const { rows } = await pool.query(`UPDATE companies SET ${changed.map((field, i) => `${field} = $${i + 1}`).join(', ')} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *`, [...values, id, userId]);
  if (!rows[0]) throw new AppError(404, 'Company not found.'); return rows[0];
}
export async function remove(id, userId) { await get(id, userId); await pool.query('DELETE FROM companies WHERE id = $1 AND user_id = $2', [id, userId]); }

