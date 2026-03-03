const API_URL = 'http://localhost:3001/api';

export const dbQuery = async (text: string, params?: unknown[]) => {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, params }),
  });

  if (!response.ok) {
    throw new Error('Database query failed');
  }

  return response.json();
};

export const db = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: async (column: string, value: unknown) => {
        const result = await dbQuery(
          `SELECT ${columns} FROM ${table} WHERE ${column} = $1`,
          [value]
        );
        return { data: result.rows, error: null };
      },
    }),
    insert: async (data: Record<string, unknown>) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const result = await dbQuery(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return { data: result.rows, error: null };
    },
    update: (data: Record<string, unknown>) => ({
      eq: async (column: string, value: unknown) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const result = await dbQuery(
          `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length + 1} RETURNING *`,
          [...values, value]
        );
        return { data: result.rows, error: null };
      },
    }),
    delete: () => ({
      eq: async (column: string, value: unknown) => {
        const result = await dbQuery(
          `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`,
          [value]
        );
        return { data: result.rows, error: null };
      },
    }),
  }),
};
