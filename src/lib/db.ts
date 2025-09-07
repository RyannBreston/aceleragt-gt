import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: DATABASE_URL is not set in environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};