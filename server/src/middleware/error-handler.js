export function notFound(req, res) { res.status(404).json({ success: false, message: 'Route not found.' }); }
export function errorHandler(error, req, res, next) {
  if (!error.statusCode) console.error(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON request body.' });
  if (error.code === '23505') return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  if (error.code === '23503') return res.status(400).json({ success: false, message: 'A related record does not exist.' });
  const status = error.statusCode || error.status || 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error.' : error.message, ...(error.details && { details: error.details }) });
}
