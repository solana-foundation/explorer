import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

if (!process.env.CI) {
    if (process.env.NODE_ENV === 'development') {
        config({ path: '.env.local' });
    } else {
        config({ path: '.env' });
    }
}

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
