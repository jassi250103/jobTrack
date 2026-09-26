import { pool } from '../db/pool.js';

export async function stats(userId) {
  const query = `WITH summary AS (
      SELECT COUNT(*)::int AS total_applications,
        COUNT(*) FILTER (WHERE status = 'OFFER')::int AS offers,
        COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejections,
        COUNT(*) FILTER (WHERE status = 'INTERVIEW')::int AS interview_applications
      FROM applications WHERE user_id = $1
    ), interview_summary AS (
      SELECT COUNT(*)::int AS total_interviews,
        COUNT(*) FILTER (WHERE i.interview_date >= CURRENT_DATE)::int AS upcoming_interviews
      FROM interviews i JOIN applications a ON a.id = i.application_id WHERE a.user_id = $1
    ), by_status AS (
      SELECT COALESCE(json_object_agg(status, count), '{}'::json) AS counts
      FROM (SELECT status, COUNT(*)::int AS count FROM applications WHERE user_id = $1 GROUP BY status) grouped
    ) SELECT summary.*, interview_summary.*, by_status.counts AS applications_by_status,
      CASE WHEN total_applications = 0 THEN 0 ELSE ROUND(interview_applications::numeric / total_applications * 100, 2) END AS interview_rate,
      CASE WHEN total_applications = 0 THEN 0 ELSE ROUND(offers::numeric / total_applications * 100, 2) END AS offer_rate
    FROM summary CROSS JOIN interview_summary CROSS JOIN by_status`;
  return (await pool.query(query, [userId])).rows[0];
}

export async function recent(userId) {
  const { rows } = await pool.query(`SELECT a.*, json_build_object('id', c.id, 'name', c.name, 'website', c.website) AS company
    FROM applications a LEFT JOIN companies c ON c.id = a.company_id
    WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT 10`, [userId]);
  return rows;
}

