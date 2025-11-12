import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const isDevelopment = process.env.NODE_ENV === 'development';

// load configuration from .env.local for tests
if (!process.env.CI && isDevelopment) {
    config({ path: '.env.local' });
}

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
