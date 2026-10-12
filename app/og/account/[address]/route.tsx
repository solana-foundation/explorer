import { BaseAccountImage, getAccountShareData, loadOgGlows } from '@features/account-share/server';
import { isAddress } from '@solana/kit';
import { Cluster, clusterFromSlug, type ServerCluster } from '@utils/cluster';
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';
import { loadOgFonts, type OgFontOption } from '@/app/shared/lib/og/fonts';
import { IMAGE_SIZE } from '@/app/shared/lib/og/image-size';

const FONTS_TO_LOAD: readonly OgFontOption[] = [
    { family: 'Rubik', weights: [400, 500] },
    { family: 'Roboto Mono', weights: [400, 500] },
];

// A resolved account is cheap to re-derive but changes slowly, so its card can sit in a cache a while.
const RESOLVED_CACHE_DURATION = 30 * 60; // 30 min
const FALLBACK_CACHE_DURATION = 60; // 1 min

type Props = Readonly<{
    params: Promise<{ address: string }>;
}>;

type ClusterParam = { kind: 'ok'; cluster?: ServerCluster } | { kind: 'invalid' };

export async function GET(request: NextRequest, props: Props) {
    const { address } = await props.params;

    if (!address || !isAddress(address)) {
        return new NextResponse('Invalid address', { status: 400 });
    }

    const clusterParam = resolveClusterParam(request);
    if (clusterParam.kind === 'invalid') return new NextResponse('Invalid cluster', { status: 400 });

    try {
        const result = await getAccountShareData(address, clusterParam.cluster);
        if (result.kind === 'error') return new NextResponse('Failed to load account', { status: 502 });

        // Both loaders cache after the first call, so this is one read per instance, not per request.
        const [fonts, glows] = await Promise.all([loadOgFonts(FONTS_TO_LOAD), loadOgGlows()]);

        const imageResponse = new ImageResponse(<BaseAccountImage data={result.data} glows={glows} />, {
            ...IMAGE_SIZE,
            fonts,
        });
        const imageBuffer = await imageResponse.arrayBuffer();

        // Only a fully resolved account gets the long cache. A not-found card may gain an account later, and
        // an incomplete card (a lookup failed, leaving an `unknown` marker or a missing count) must not pin a
        // false-negative for the full lifetime - both fall back to the short duration.
        const isResolved = result.data.kind !== 'not-found' && !result.data.incomplete;
        return new NextResponse(imageBuffer, {
            headers: {
                ...cacheHeaders(isResolved ? RESOLVED_CACHE_DURATION : FALLBACK_CACHE_DURATION),
                'Content-Type': 'image/png',
            },
        });
    } catch (e) {
        Logger.error(new Error('[og:account] Failed to generate image', { cause: e }), { address, sentry: true });
        return new NextResponse('Failed to process request', { status: 500 });
    }
}

function cacheHeaders(duration: number) {
    return { 'Cache-Control': `public, max-age=${duration}, s-maxage=${duration}, stale-while-revalidate=60` };
}

function resolveClusterParam(request: NextRequest): ClusterParam {
    const { search, searchParams } = request.nextUrl;
    const slug = searchParams.get('cluster') ?? undefined;

    // The CDN keys on the whole URL, so a second spelling of one request is a fresh miss. Comparing the raw
    // query against the param it parsed to leaves only the two shapes `getAccountOgImageUrl` emits.
    const canonical = slug === undefined ? '' : `?cluster=${slug}`;
    if (search !== canonical) {
        Logger.warn('[og:account] Rejected a query that is not the canonical shape');
        return { kind: 'invalid' };
    }

    // An absent param means mainnet by the app's own contract.
    if (slug === undefined) return { kind: 'ok' };

    const cluster = clusterFromSlug(slug);
    // Custom is rejected rather than resolved: its URL is client-supplied, so honouring it on an
    // unauthenticated route would let a caller aim our server at any host.
    if (cluster === undefined || cluster === Cluster.Custom) return { kind: 'invalid' };

    return { cluster, kind: 'ok' };
}
