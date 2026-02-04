import { getTokenInfos, isValidCluster } from '@entities/token-info';
import { Cluster } from '@utils/cluster';
import { NextResponse } from 'next/server';

const CACHE_MAX_AGE = 3600; // 1 hour

export async function POST(request: Request) {
    const { address, cluster, genesisHash } = await request.json();

    const maybeGenesisHash = typeof genesisHash === 'string' ? genesisHash : undefined;

    if (typeof address !== 'string' || !isValidCluster(cluster, maybeGenesisHash)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Allow to resolve chainId with genesisHash as the request does not use Connection instance
    // For requests that use Connection, Custom cluster should be disabled
    const tokens = await getTokenInfos([address], cluster as Cluster, maybeGenesisHash, {
        next: { revalidate: CACHE_MAX_AGE },
    });
    return NextResponse.json({ content: tokens[0] });
}
