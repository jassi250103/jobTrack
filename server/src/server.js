import { env } from './config/env.js'; import { pool } from './db/pool.js'; import app from './app.js';
const server = app.listen(env.port, () => console.log(`JobTrack API listening on port ${env.port}`));
async function shutdown(signal) { console.log(`${signal} received; shutting down.`); server.close(async () => { await pool.end(); process.exit(0); }); }
process.on('SIGTERM', () => shutdown('SIGTERM')); process.on('SIGINT', () => shutdown('SIGINT'));

