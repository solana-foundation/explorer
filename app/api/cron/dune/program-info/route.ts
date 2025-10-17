import { DuneClient, ResultsResponse, RunQueryArgs } from '@duneanalytics/client-sdk';
import { NextResponse } from 'next/server';

import { requireCronAuth } from '@/app/api/shared/auth';
import { replaceTableData } from '@/app/api/shared/db-helpers';
import { respondWithError } from '@/app/api/shared/errors';
import Logger from '@/app/utils/logger';
import { program_stats } from '@/src/db/schema';

const { DUNE_API_KEY, DUNE_PROGRAM_STATS_MV_ID } = process.env;

if (!DUNE_API_KEY || !DUNE_PROGRAM_STATS_MV_ID) {
    throw new Error('DUNE_API_KEY, DUNE_PROGRAM_STATS_MV_ID must be set in environment variables');
}

export async function GET() {
    const authError = requireCronAuth();
    if (authError) return authError;

    let executionResult: ResultsResponse;
    try {
        const client = new DuneClient(DUNE_API_KEY ?? '');
        const opts: RunQueryArgs = { queryId: Number(DUNE_PROGRAM_STATS_MV_ID) };
        executionResult = await client.getLatestResult(opts);
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    try {
        const values = (executionResult.result?.rows ?? []).map(row => ({
            calling_programs_count: Number(row.calling_programs_count),
            created_at: row.created_at,
            program_address: String(row.program_address),
            transaction_references_count: Number(row.transaction_references_count),
        }));

        await replaceTableData(program_stats, values);
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    return NextResponse.json({ ok: true });
}
