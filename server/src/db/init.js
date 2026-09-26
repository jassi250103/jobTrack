import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));
try {
  await pool.query(await fs.readFile(schemaPath, 'utf8'));
  console.log('Database schema initialized successfully.');
} finally {
  await pool.end();
}

