import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in environment variables');
}

// Create a Neon Pool over WebSockets:
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);
