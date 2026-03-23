import { fetchSnsDomains } from '@entities/domain/api/fetch-sns-domains';
import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=3600' };

type Params = {
    params: {
        address: string;
    };
};

export async function GET(_request: Request, { params: { address } }: Params) {
    try {
        new PublicKey(address);
    } catch {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    try {
        const domains = await fetchSnsDomains(address);

        if (!domains) {
            Logger.info(`Bonfida API returned 404 for address: ${address}`);
            return NextResponse.json({ domains: [] }, { headers: { 'Cache-Control': 'no-store' }, status: 404 });
        }

        return NextResponse.json({ domains }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error(error, { address });
        return NextResponse.json({ domains: [] }, { headers: { 'Cache-Control': 'no-store' }, status: 500 });
    }
}
