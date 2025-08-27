import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { respondWithError } from '@/app/api/shared/errors';
import Logger from '@/app/utils/logger';
import { db } from '@/src/db/drizzle';

const { CRON_SECRET } = process.env;

if (!CRON_SECRET) {
    throw new Error('CRON_SECRET must be set in environment variables');
}

export async function GET() {
    const headersList = headers();
    if (headersList.get('Authorization') !== `Bearer ${CRON_SECRET}`) {
        Logger.error(new Error('Unauthorized access attempt'));
        return respondWithError(401);
    }

    try {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.quicknode_stream_cpi_program_calls_mv;`);
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    return NextResponse.json({ ok: true });
}
