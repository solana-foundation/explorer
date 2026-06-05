import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

import { getAssetBatch } from '@/app/entities/digital-asset/server';
import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterFromSlug, clusterSlug, serverClusterUrl } from '@/app/utils/cluster';

const IMAGE_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600',
};

type Params = {
    params: Promise<{
        mintAddress: string;
    }>;
};

export async function GET(request: Request, props: Params) {
    const { mintAddress } = await props.params;

    try {
        new PublicKey(mintAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const clusterParam = searchParams.get('cluster') ?? clusterSlug(Cluster.MainnetBeta);
    const customUrl = searchParams.get('customUrl') ?? '';

    const cluster = clusterFromSlug(clusterParam);
    if (cluster === null) {
        return NextResponse.json({ error: 'Invalid cluster' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    const rpcUrl = serverClusterUrl(cluster, customUrl);

    try {
        const assets = await getAssetBatch([mintAddress], rpcUrl);
        const asset = assets?.find(a => a.id === mintAddress);
        const image = asset?.content.links?.image;
        return NextResponse.json({ image }, { headers: IMAGE_CACHE_HEADERS });
    } catch (error) {
        Logger.panic(error instanceof Error ? error : new Error('[api:token-image] DAS request failed'));
        return NextResponse.json({ error: 'Failed to fetch token image' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}
