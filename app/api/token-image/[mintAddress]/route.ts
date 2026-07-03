import { isAddress } from '@solana/kit';
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

    if (!isAddress(mintAddress)) {
        return NextResponse.json({ error: 'Invalid mint address' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const clusterParam = searchParams.get('cluster') ?? clusterSlug(Cluster.MainnetBeta);

    const cluster = clusterFromSlug(clusterParam);
    if (cluster === null) {
        return NextResponse.json({ error: 'Invalid cluster' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    if (cluster === Cluster.Custom) {
        return NextResponse.json(
            { error: 'Custom cluster is not supported' },
            { headers: NO_STORE_HEADERS, status: 400 },
        );
    }

    const rpcUrl = serverClusterUrl(cluster, '');
    Logger.info(`[token-image] rpcUrl: ${rpcUrl} | mintAddress: ${mintAddress} | cluster: ${cluster}`);

    const assets = await getAssetBatch([mintAddress], rpcUrl);
    Logger.info(`[token-image] getAssetBatch result: ${JSON.stringify(assets)}`);

    if (!assets) {
        Logger.info('[token-image] No assets returned — responding with no-store');
        return NextResponse.json({ image: undefined }, { headers: NO_STORE_HEADERS });
    }

    const asset = assets.find(a => a.id === mintAddress);
    Logger.info(`[token-image] matched asset: ${JSON.stringify(asset)}`);
    const image = asset?.content?.links?.image;
    Logger.info(`[token-image] image value: ${image}`);
    return NextResponse.json({ image }, { headers: IMAGE_CACHE_HEADERS });
}
