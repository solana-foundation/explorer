import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { createCacheHeaders } from '@/app/api/shared/cache';
import { respondWithError } from '@/app/api/shared/errors';
import { validateSolanaAddress, ValidationError } from '@/app/api/shared/validation';
import Logger from '@/app/utils/logger';
import { SentryLogger } from '@/app/utils/logger-sentry';
import { db } from '@/src/db/drizzle';
import { program_stats } from '@/src/db/schema';

const CACHE_HEADERS = createCacheHeaders(1800);

type Params = {
    params: {
        address: string;
    };
};

export async function GET(request: Request, { params: { address } }: Params) {
    try {
        validateSolanaAddress(address);

        const data = await db.select().from(program_stats).where(eq(program_stats.program_address, address));

        return NextResponse.json(data, {
            headers: CACHE_HEADERS,
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            Logger.error(error);
            return respondWithError(400);
        }

        Logger.error(error);
        SentryLogger.error(error);
        return respondWithError(500);
    }
}
