import * as applications from '../services/application.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { assertAllowed, assertDate, assertId, assertSalary, assertString, assertUrl, pagination, requireFields, statuses } from '../utils/validation.js';

function validate(body, required = false) {
  if (required) requireFields(body, ['position']);

  if (body.position !== undefined && body.position !== null && String(body.position).trim() === '') body.position = null;
  if (body.location !== undefined && body.location !== null && String(body.location).trim() === '') body.location = null;
  if (body.job_url !== undefined && body.job_url !== null && String(body.job_url).trim() === '') body.job_url = null;
  if (body.notes !== undefined && body.notes !== null && String(body.notes).trim() === '') body.notes = null;

  if (body.position !== undefined && body.position !== null) assertString(body.position, 'position', { max: 180 });
  if (body.location !== undefined && body.location !== null) assertString(body.location, 'location', { max: 180 });
  if (body.salary !== undefined && body.salary !== null && body.salary !== '') {
    body.salary = String(body.salary).trim().replace(/[₹,\s]/g, '');
  }
  assertAllowed(body.status, statuses, 'status');
  if (body.applied_date !== undefined && body.applied_date !== null && String(body.applied_date).trim() === '') body.applied_date = null;
  assertDate(body.applied_date, 'applied_date');
  assertUrl(body.job_url, 'job_url');
  assertSalary(body.salary);
  if (body.company_id !== undefined && body.company_id !== null) assertId(body.company_id, 'company_id');
}
export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const status = req.query.status === '' ? undefined : req.query.status;
  const search = req.query.search === '' ? undefined : req.query.search;
  const sort = req.query.sort === '' ? undefined : req.query.sort;
  const order = req.query.order === '' ? undefined : req.query.order;
  const companyId = req.query.companyId === '' ? undefined : req.query.companyId;
  const location = req.query.location === '' ? undefined : req.query.location;
  const fromDate = req.query.fromDate === '' ? undefined : req.query.fromDate;
  const toDate = req.query.toDate === '' ? undefined : req.query.toDate;

  assertAllowed(status, statuses, 'status');
  if (search !== undefined) assertString(search, 'search', { min: 1, max: 120 });
  if (companyId !== undefined) assertId(companyId, 'companyId');
  if (location !== undefined) assertString(location, 'location', { min: 1, max: 180 });
  assertDate(fromDate, 'fromDate');
  assertDate(toDate, 'toDate');
  if (sort !== undefined && !['applied_date', 'created_at', 'updated_at', 'position', 'status'].includes(sort)) throw Object.assign(new Error('Invalid sort field.'), { statusCode: 400 });
  if (order !== undefined && !['asc', 'desc'].includes(order.toLowerCase())) throw Object.assign(new Error('order must be asc or desc.'), { statusCode: 400 });

  res.json({ success: true, ...(await applications.list(req.user.sub, { page, limit, offset, status, search, sort, order: order?.toLowerCase(), companyId, location, fromDate, toDate })) });
});
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await applications.get(assertId(req.params.id), req.user.sub) }));
export const create = asyncHandler(async (req, res) => { validate(req.body, true); res.status(201).json({ success: true, data: await applications.create(req.body, req.user.sub) }); });
export const update = asyncHandler(async (req, res) => { validate(req.body); res.json({ success: true, data: await applications.update(assertId(req.params.id), req.body, req.user.sub) }); });
export const remove = asyncHandler(async (req, res) => { await applications.remove(assertId(req.params.id), req.user.sub); res.status(204).send(); });
