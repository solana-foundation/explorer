import { desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { createCacheHeaders } from '@/app/api/shared/cache';
import { respondWithError } from '@/app/api/shared/errors';
import { calculatePagination, PaginationError,parsePaginationParams } from '@/app/api/shared/pagination';
import { validateSolanaAddress, ValidationError } from '@/app/api/shared/validation';
import Logger from '@/app/utils/logger';
import { SentryLogger } from '@/app/utils/logger-sentry';
import { db } from '@/src/db/drizzle';
import { program_call_stats } from '@/src/db/schema';

const CACHE_HEADERS = createCacheHeaders(1800);

type Params = {
    params: {
        address: string;
    };
};

export async function GET(request: Request, { params: { address } }: Params) {
    try {
        validateSolanaAddress(address);

        const { searchParams } = new URL(request.url);
        const { limit, offset } = parsePaginationParams(searchParams);

        const data = await db
            .select({
                address: program_call_stats.address,
                calls_number: program_call_stats.calls_number,
                createdAt: program_call_stats.createdAt,
                description: program_call_stats.description,
                name: program_call_stats.name,
                program_address: program_call_stats.program_address,
            })
            .from(program_call_stats)
            .where(eq(program_call_stats.program_address, address))
            .orderBy(desc(program_call_stats.calls_number))
            .limit(limit)
            .offset(offset);

        const [{ total }] = await db
            .select({ total: sql<number>`COUNT(*)` })
            .from(program_call_stats)
            .where(eq(program_call_stats.program_address, address));

        const pagination = calculatePagination({ limit, offset }, total);

        return NextResponse.json(
            {
                data,
                pagination,
            },
            {
                headers: CACHE_HEADERS,
            }
        );
    } catch (error) {
        if (error instanceof ValidationError || error instanceof PaginationError) {
            Logger.error(error);
            return respondWithError(400);
        }

        Logger.error(error);
        SentryLogger.error(error);
        return respondWithError(500);
    }
}
