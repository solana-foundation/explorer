import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in environment variables');
}

// Create a Postgres Pool:
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);
