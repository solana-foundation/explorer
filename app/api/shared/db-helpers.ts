import { PgTable } from 'drizzle-orm/pg-core';

import { db } from '@/src/db/drizzle';

/**
 * Replaces all data in a table within a transaction
 * Deletes all existing rows and inserts new values
 * @param table - Drizzle table schema
 * @param values - Array of values to insert
 */
export async function replaceTableData<T extends Record<string, unknown>>(table: PgTable, values: T[]): Promise<void> {
    await db.transaction(async tx => {
        await tx.delete(table).execute();

        if (values.length > 0) {
            await tx.insert(table).values(values).execute();
        }
    });
}
