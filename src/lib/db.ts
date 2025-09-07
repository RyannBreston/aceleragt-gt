import { Pool } from 'pg';

// Cria um "pool" de conexões. O Next.js pode usar várias conexões em paralelo.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};