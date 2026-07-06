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

    // --- FORMAT PROBE: try every common DAS variant in parallel, log each raw result ---
    const probeVariants: { label: string; method: string; params: unknown }[] = [
        { label: 'getAsset (singular, {id})', method: 'getAsset', params: { id: mintAddress } },
        { label: 'getAssets ({ids:[]})', method: 'getAssets', params: { ids: [mintAddress] } },
        { label: 'getAssetBatch ({ids:[]})', method: 'getAssetBatch', params: { ids: [mintAddress] } },
        { label: 'getAssets (array params)', method: 'getAssets', params: [mintAddress] },
        { label: 'getAssetBatch (array params)', method: 'getAssetBatch', params: [mintAddress] },
    ];
    await Promise.all(
        probeVariants.map(async ({ label, method, params }) => {
            try {
                const res = await fetch(rpcUrl, {
                    body: JSON.stringify({ id: 'probe', jsonrpc: '2.0', method, params }),
                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST',
                });
                const json = await res.json();
                Logger.info(`[das-probe] ${label}: ${JSON.stringify(json)}`);
            } catch (err) {
                Logger.warn(`[das-probe] ${label} threw: ${String(err)}`);
            }
        }),
    );
    // --- END FORMAT PROBE ---

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
