import { isAddress } from '@solana/kit';
import { NextResponse } from 'next/server';

import { getAssetBatch } from '@/app/entities/digital-asset/server';
import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Cluster, clusterFromSlug, clusterSlug, serverClusterUrl } from '@/app/utils/cluster';

const IMAGE_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600',
};

type Params = {
    params: Promise<{
        mintAddress: string;
    }>;
};

/* eslint-disable no-console */
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
    console.log('[token-image] rpcUrl:', rpcUrl, '| mint:', mintAddress, '| cluster:', cluster);

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
                console.log(`[das-probe] ${label}:`, JSON.stringify(json));
            } catch (err) {
                console.log(`[das-probe] ${label} threw:`, String(err));
            }
        }),
    );
    // --- END FORMAT PROBE ---

    const assets = await getAssetBatch([mintAddress], rpcUrl);
    console.log('[token-image] getAssetBatch result:', JSON.stringify(assets));

    if (!assets) {
        console.log('[token-image] no assets returned');
        return NextResponse.json({ image: undefined }, { headers: NO_STORE_HEADERS });
    }

    const asset = assets.find(a => a.id === mintAddress);
    console.log('[token-image] matched asset:', JSON.stringify(asset));
    const image = asset?.content?.links?.image;
    console.log('[token-image] image value:', image);
    return NextResponse.json({ image }, { headers: IMAGE_CACHE_HEADERS });
}
/* eslint-enable no-console */
