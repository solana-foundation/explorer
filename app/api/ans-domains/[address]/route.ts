import { fetchAnsDomains } from '@entities/domain';
import { PublicKey } from '@solana/web3.js';
import Logger from '@utils/logger';
import { NextResponse } from 'next/server';

const CACHE_HEADERS = { 'Cache-Control': 'max-age=86400' };

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
        Logger.error(error, `Failed to fetch ANS domains for ${address}`);
        return NextResponse.json({ domains: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
}
