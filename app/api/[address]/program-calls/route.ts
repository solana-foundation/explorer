import { desc, eq, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { NextResponse } from 'next/server';

import { respondWithError } from '@/app/api/shared/errors';
import Logger from '@/app/utils/logger';
import { SentryLogger } from '@/app/utils/logger-sentry';
import { db } from '@/src/db/drizzle';
import { program_call_stats, quicknode_stream_cpi_program_calls_mv } from '@/src/db/schema';

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
    const { searchParams } = new URL(request.url);
    let limit: number;
    let offset: number;

    try {
        limit = parseInt(searchParams.get('limit') || '50');
        offset = parseInt(searchParams.get('offset') || '0');

        // Check for invalid values (NaN or negative numbers)
        if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0 || limit > 100) {
            return respondWithError(400);
        }
    } catch (error) {
        Logger.error(error);
        return respondWithError(400);
    }

    let data;
    let dune_data;
    let quicknode_data;
    let unionSub;
    let totalPages;
    try {
        dune_data = db
            .select({
                address: program_call_stats.address,
                calls_number: program_call_stats.calls_number,
                createdAt: program_call_stats.createdAt,
                description: program_call_stats.description,
                name: program_call_stats.name,
                program_address: program_call_stats.program_address,
            })
            .from(program_call_stats)
            .where(eq(program_call_stats.program_address, address));

        quicknode_data = db
            .select({
                address: sql<string>`COALESCE(${quicknode_stream_cpi_program_calls_mv.callerProgramAddress}, '')`,
                calls_number: sql<number>`COALESCE(${quicknode_stream_cpi_program_calls_mv.callsNumber}, 0)::integer`,
                createdAt: sql<Date>`'-infinity'::date`,
                description: sql<string>`NULL`,
                name: sql<string>`NULL`,
                program_address: sql<string>`COALESCE(${quicknode_stream_cpi_program_calls_mv.programAddress}, '')`,
            })
            .from(quicknode_stream_cpi_program_calls_mv)
            .where(eq(quicknode_stream_cpi_program_calls_mv.programAddress, address));

        unionSub = unionAll(dune_data, quicknode_data).as('u');

        data = await db
            .select({
                address: unionSub.address,
                calls_number: sql<number>`SUM(${unionSub.calls_number})::integer`,
                createdAt: sql<Date>`MAX(${unionSub.createdAt})`,
                description: sql<string>`MAX(${unionSub.description})`,
                name: sql<string>`MAX(${unionSub.name})`,
                program_address: unionSub.program_address,
            })
            .from(unionSub)
            .groupBy(unionSub.address, unionSub.program_address)
            .orderBy(desc(sql`SUM(${unionSub.calls_number})`))
            .limit(limit)
            .offset(offset);

        const [{ total }] = await db
            .select({
                total: sql<number>`COUNT(DISTINCT (${unionSub.address}, ${unionSub.program_address}))`,
            })
            .from(unionSub);

        totalPages = limit ? Math.ceil(total / limit) : 0;
    } catch (error) {
        Logger.error(error);
        SentryLogger.error(error);
        return respondWithError(500);
    }

    return NextResponse.json(
        {
            data,
            pagination: {
                limit,
                offset,
                totalPages,
            },
        },
        {
            headers: CACHE_HEADERS,
        }
    );
}
