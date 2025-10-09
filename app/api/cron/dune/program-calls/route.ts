import { DuneClient, ResultsResponse, RunQueryArgs } from '@duneanalytics/client-sdk';
import { NextResponse } from 'next/server';

import { requireCronAuth } from '@/app/api/shared/auth';
import { programNameCache } from '@/app/api/shared/caching';
import { replaceTableData } from '@/app/api/shared/db-helpers';
import { respondWithError } from '@/app/api/shared/errors';
import { getProgramMetadataIdl, programNameFromIdl } from '@/app/components/instruction/codama/getProgramMetadataIdl';
import { Cluster, serverClusterUrl } from '@/app/utils/cluster';
import Logger from '@/app/utils/logger';
import { PROGRAM_INFO_BY_ID } from '@/app/utils/programs';
import { program_call_stats } from '@/src/db/schema';

const { DUNE_API_KEY, DUNE_PROGRAM_CALLS_MV_ID } = process.env;

if (!DUNE_API_KEY || !DUNE_PROGRAM_CALLS_MV_ID) {
    throw new Error('DUNE_API_KEY, DUNE_PROGRAM_CALLS_MV_ID must be set in environment variables');
}

export async function GET() {
    const authError = requireCronAuth();
    if (authError) return authError;

    let executionResult: ResultsResponse;
    try {
        const client = new DuneClient(DUNE_API_KEY ?? '');
        const opts: RunQueryArgs = { queryId: Number(DUNE_PROGRAM_CALLS_MV_ID) };
        executionResult = await client.getLatestResult(opts);
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    const rows = executionResult.result?.rows ?? [];

    const values: Array<{
        address: string;
        block_slot: string;
        calls_number: number;
        created_at: string | Date;
        description: string;
        name: string;
        program_address: string;
    }> = await mapWithLimit(rows, 7, async row => {
        const address = String(row.address);
        const progAddr = String(row.program_address);
        const name = await buildProgramName(String(row.address), String(row.program_name));

        return {
            address,
            block_slot: String(row.block_slot ?? '0'),
            calls_number: Number(row.calls_number ?? 0),
            created_at: String(row.created_at ?? new Date().toISOString()),
            description: String(row.program_description ?? ''),
            name,
            program_address: progAddr,
        };
    });

    try {
        await replaceTableData(program_call_stats, values);
    } catch (error) {
        Logger.error(error);
        return respondWithError(500);
    }

    return NextResponse.json({ ok: true });
}

async function buildProgramName(address: string, program_name: string): Promise<string> {
    const cached = programNameCache.get(address);
    if (cached !== undefined) return cached;

    if (PROGRAM_INFO_BY_ID[address]) {
        const staticHashName = String(PROGRAM_INFO_BY_ID[address].name);
        programNameCache.set(address, staticHashName);
        return staticHashName;
    }
    const pmName = await getPmName(address);
    if (pmName !== null && pmName !== undefined && pmName !== '') {
        programNameCache.set(address, pmName);
        return String(pmName);
    }
    programNameCache.set(address, program_name);
    return program_name;
}

async function getPmName(address: string): Promise<string> {
    const cluster = Cluster.MainnetBeta;
    const url = serverClusterUrl(cluster, '');

    // otherwise run your existing parser, and still fall back to “None”
    try {
        const idl = await getProgramMetadataIdl(address, url);

        // if there’s no IDL, just return “None”
        if (!idl) {
            return '';
        }

        return programNameFromIdl(idl) ?? '';
    } catch (error) {
        return '';
    }
}

async function mapWithLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
    const ret: R[] = new Array(items.length);
    let i = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (i >= 0) {
            const idx = i++;
            if (idx >= items.length) break;
            ret[idx] = await fn(items[idx]);
        }
    });
    await Promise.all(workers);
    return ret;
}
