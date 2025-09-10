import { Pool } from 'pg';

// Verificação mais robusta das variáveis de ambiente
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('FATAL: DATABASE_URL is not set in environment variables.');
}

// Pool com configurações melhoradas para melhor desempenho
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // aumenta o número máximo de conexões para melhor desempenho
  idleTimeoutMillis: 30000, // tempo para encerrar conexões ociosas
  connectionTimeoutMillis: 5000, // timeout de conexão reduzido
});

export const db = {
  query: (text: string, params?: (string | number | boolean | Date)[]) => pool.query(text, params),
  getClient: () => pool.connect(),
  // Adicionando método para transações
  transaction: async (callback: (client: PoolClient) => Promise<unknown>) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

// Exportação do tipo PoolClient
import { PoolClient } from 'pg';
