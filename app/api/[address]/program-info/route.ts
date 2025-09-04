import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { respondWithError } from '@/app/api/shared/errors';
import Logger from '@/app/utils/logger';
import { db } from '@/src/db/drizzle';
import { program_stats } from '@/src/db/schema';

const CACHE_DURATION = 5;
const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=2`,
};

type Params = {
    params: {
        address: string;
    };
};

export async function GET(request: Request, { params: { address } }: Params) {
    let data;
    try {
        data = await db.select().from(program_stats).where(eq(program_stats.program_address, address));
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    return NextResponse.json(data, {
        headers: CACHE_HEADERS,
    });
}
