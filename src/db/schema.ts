import * as p from 'drizzle-orm/pg-core';

export const program_call_stats = p.pgTable(
    'program_call_stats',
    {
        address: p.text().notNull(),
        block_slot: p.text('block_slot').notNull(),
        calls_number: p.integer().notNull().default(0),
        createdAt: p.timestamp('created_at').defaultNow().notNull(),
        description: p.text().notNull().default(''),
        name: p.text().notNull().default(''),
        program_address: p.text().notNull(),
    },
    t => [p.unique().on(t.program_address, t.address)]
);

export const program_stats = p.pgTable(
    'program_stats',
    {
        calling_programs_count: p.integer().notNull().default(0),
        createdAt: p.timestamp('created_at').defaultNow().notNull(),
        program_address: p.text().notNull(),
        transaction_references_count: p.integer().notNull().default(0),
    },
    t => [p.unique().on(t.program_address)]
);
