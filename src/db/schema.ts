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

export const quicknode_stream_cpi_program_calls = p.pgTable(
    'quicknode_stream_cpi_program_calls',
    {
        data: p.jsonb('data').notNull(),
        fromBlockNumber: p.bigint('from_block_number', { mode: 'bigint' }).notNull(),
        network: p.varchar('network', { length: 255 }).notNull(),
        streamId: p.uuid('stream_id').notNull(),
        toBlockNumber: p.bigint('to_block_number', { mode: 'bigint' }).notNull(),
    },
    t => ({
        pk: p.primaryKey({
            columns: [t.network, t.fromBlockNumber, t.toBlockNumber],
            name: 't_pkey',
        }),
    })
);

export const quicknode_stream_cpi_program_calls_mv = p
    .pgMaterializedView('quicknode_stream_cpi_program_calls_mv', {
        callerProgramAddress: p.text('caller_program_address'),
        callsNumber: p.bigint('calls_number', { mode: 'bigint' }),
        programAddress: p.text('program_address'),
    })
    .existing();
