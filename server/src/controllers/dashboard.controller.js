import * as dashboard from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const stats = asyncHandler(async (req, res) => res.json({ success: true, data: await dashboard.stats(req.user.sub) }));
export const recent = asyncHandler(async (req, res) => res.json({ success: true, data: await dashboard.recent(req.user.sub) }));

