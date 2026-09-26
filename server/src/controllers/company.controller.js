import * as companies from '../services/company.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { assertId, assertString, assertUrl, requireFields } from '../utils/validation.js';

function validate(body, required = false) { if (required) requireFields(body, ['name']); if (body.name !== undefined) assertString(body.name, 'name', { max: 180 }); if (body.website !== undefined) assertUrl(body.website, 'website'); }
export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await companies.list(req.user.sub) }));
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await companies.get(assertId(req.params.id), req.user.sub) }));
export const create = asyncHandler(async (req, res) => { validate(req.body, true); res.status(201).json({ success: true, data: await companies.create(req.body, req.user.sub) }); });
export const update = asyncHandler(async (req, res) => { validate(req.body); res.json({ success: true, data: await companies.update(assertId(req.params.id), req.body, req.user.sub) }); });
export const remove = asyncHandler(async (req, res) => { await companies.remove(assertId(req.params.id), req.user.sub); res.status(204).send(); });
