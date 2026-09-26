import { pool } from '../db/pool.js';
import { AppError } from '../utils/app-error.js';

const fields = ['company_id', 'position', 'location', 'salary', 'job_url', 'status', 'applied_date', 'notes'];
const base = `SELECT a.*, json_build_object('id', c.id, 'name', c.name, 'website', c.website, 'location', c.location, 'industry', c.industry) AS company
  FROM applications a LEFT JOIN companies c ON c.id = a.company_id`;
const sortColumns = { applied_date: 'a.applied_date', created_at: 'a.created_at', updated_at: 'a.updated_at', position: 'a.position', status: 'a.status' };

async function ensureCompanyOwned(companyId, userId) {
  if (companyId === undefined || companyId === null) return;
  const { rowCount } = await pool.query('SELECT 1 FROM companies WHERE id = $1 AND user_id = $2', [companyId, userId]);
  if (!rowCount) throw new AppError(400, 'Company not found for this user.');
}

export async function list(userId, { page, limit, offset, status, search, sort, order, companyId, location, fromDate, toDate }) {
  const clauses = ['a.user_id = $1']; const values = [userId];
  if (status) { values.push(status); clauses.push(`a.status = $${values.length}`); }
  if (search) { values.push(`%${search}%`); clauses.push(`(a.position ILIKE $${values.length} OR a.location ILIKE $${values.length} OR c.name ILIKE $${values.length})`); }
  if (companyId) { values.push(companyId); clauses.push(`a.company_id = $${values.length}`); }
  if (location) { values.push(`%${location}%`); clauses.push(`a.location ILIKE $${values.length}`); }
  if (fromDate) { values.push(fromDate); clauses.push(`a.applied_date >= $${values.length}`); }
  if (toDate) { values.push(toDate); clauses.push(`a.applied_date <= $${values.length}`); }
  const where = `WHERE ${clauses.join(' AND ')}`;
  const sortColumn = sortColumns[sort] || sortColumns.created_at;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const countQuery = `SELECT COUNT(*)::int AS total FROM applications a LEFT JOIN companies c ON c.id = a.company_id ${where}`;
  const { rows: countRows } = await pool.query(countQuery, values);
  const queryValues = [...values, limit, offset];
  const { rows } = await pool.query(`${base} ${where} ORDER BY ${sortColumn} ${direction}, a.id DESC LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`, queryValues);
  const total = countRows[0].total;
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function get(id, userId) {
  const { rows } = await pool.query(`${base} WHERE a.id = $1 AND a.user_id = $2`, [id, userId]);
  if (!rows[0]) throw new AppError(404, 'Application not found.'); return rows[0];
}
export async function create(body, userId) {
  await ensureCompanyOwned(body.company_id, userId);
  const values = fields.map((f) => body[f] ?? null); values[5] ??= 'APPLIED';
  const { rows } = await pool.query(`INSERT INTO applications (user_id, ${fields.join(', ')}) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [userId, ...values]);
  return get(rows[0].id, userId);
}
export async function update(id, body, userId) {
  const changed = fields.filter((f) => body[f] !== undefined);
  if (!changed.length) throw new AppError(400, 'No fields supplied for update.');
  await ensureCompanyOwned(body.company_id, userId);
  const values = changed.map((f) => body[f]);
  const { rowCount } = await pool.query(`UPDATE applications SET ${changed.map((f, i) => `${f} = $${i + 1}`).join(', ')} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`, [...values, id, userId]);
  if (!rowCount) throw new AppError(404, 'Application not found.'); return get(id, userId);
}
export async function remove(id, userId) { await get(id, userId); await pool.query('DELETE FROM applications WHERE id = $1 AND user_id = $2', [id, userId]); }
