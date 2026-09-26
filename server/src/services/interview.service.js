import { pool } from '../db/pool.js';
import { AppError } from '../utils/app-error.js';

const fields = ['application_id', 'round_name', 'interview_date', 'interview_time', 'type', 'meeting_link', 'notes', 'result'];
const base = `SELECT i.* FROM interviews i JOIN applications a ON a.id = i.application_id`;
export const list = async (userId) => (await pool.query(`${base} WHERE a.user_id = $1 ORDER BY i.interview_date ASC, i.interview_time ASC NULLS LAST`, [userId])).rows;
export async function get(id, userId) {
  const { rows } = await pool.query(`${base} WHERE i.id = $1 AND a.user_id = $2`, [id, userId]);
  if (!rows[0]) throw new AppError(404, 'Interview not found.'); return rows[0];
}
async function ownsApplication(applicationId, userId) {
  const { rowCount } = await pool.query('SELECT 1 FROM applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
  if (!rowCount) throw new AppError(404, 'Application not found.');
}
export async function create(body, userId) {
  await ownsApplication(body.application_id, userId);
  const { rows } = await pool.query(`INSERT INTO interviews (${fields.join(', ')}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, fields.map((f) => body[f] ?? null)); return rows[0];
}
export async function update(id, body, userId) {
  await get(id, userId);
  if (body.application_id !== undefined) await ownsApplication(body.application_id, userId);
  const changed = fields.filter((f) => body[f] !== undefined);
  if (!changed.length) throw new AppError(400, 'No fields supplied for update.');
  const values = changed.map((f) => body[f]);
  const { rows } = await pool.query(`UPDATE interviews SET ${changed.map((f, i) => `${f} = $${i + 1}`).join(', ')} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]); return rows[0];
}
export async function remove(id, userId) { await get(id, userId); await pool.query('DELETE FROM interviews WHERE id = $1', [id]); }

