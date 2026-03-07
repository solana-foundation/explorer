import { fetchAnsDomains } from '@entities/domain/api/fetch-ans-domains';
import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' };

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
        const domains = await fetchAnsDomains(address);
        return NextResponse.json({ domains }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error('[api:ans-domains] Failed to fetch ANS domains', { address, error });
        return NextResponse.json({ domains: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
}
