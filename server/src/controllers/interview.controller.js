import * as interviews from '../services/interview.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { assertAllowed, assertDate, assertId, assertString, assertUrl, interviewResults, interviewTypes, requireFields } from '../utils/validation.js';

function validate(body, required = false) { if (required) requireFields(body, ['application_id', 'round_name', 'interview_date', 'type']); if (body.application_id !== undefined) assertId(body.application_id, 'application_id'); if (body.round_name !== undefined) assertString(body.round_name, 'round_name', { max: 120 }); assertDate(body.interview_date, 'interview_date'); if (body.interview_time !== undefined && body.interview_time !== null && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body.interview_time)) throw Object.assign(new Error('Invalid interview_time. Use HH:MM.'), { statusCode: 400 }); assertUrl(body.meeting_link, 'meeting_link'); assertAllowed(body.type, interviewTypes, 'type'); assertAllowed(body.result, interviewResults, 'result'); }
export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await interviews.list(req.user.sub) }));
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await interviews.get(assertId(req.params.id), req.user.sub) }));
export const create = asyncHandler(async (req, res) => { validate(req.body, true); res.status(201).json({ success: true, data: await interviews.create(req.body, req.user.sub) }); });
export const update = asyncHandler(async (req, res) => { validate(req.body); res.json({ success: true, data: await interviews.update(assertId(req.params.id), req.body, req.user.sub) }); });
export const remove = asyncHandler(async (req, res) => { await interviews.remove(assertId(req.params.id), req.user.sub); res.status(204).send(); });
