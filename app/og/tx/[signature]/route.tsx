import { BaseTxImage, getTxShareData, loadOgGlows, TxImageNotAvailable } from '@features/transaction-share/server';
import { Cluster, clusterFromSlug, type ServerCluster } from '@utils/cluster';
import { isSignatureValid } from '@utils/tx';
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import type { ReactElement } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { loadOgFonts, type OgFontOption } from '@/app/shared/lib/og/fonts';
import { IMAGE_SIZE } from '@/app/shared/lib/og/image-size';

const FONTS_TO_LOAD: readonly OgFontOption[] = [
    { family: 'Rubik', weights: [400, 500] },
    { family: 'Roboto Mono', weights: [400, 500] },
];

// A resolved transaction is immutable, so its card can sit in a cache for a long time.
const RESOLVED_CACHE_DURATION = 30 * 60; // 30 min
const FALLBACK_CACHE_DURATION = 60; // 1 min

type Props = Readonly<{
    params: Promise<{ signature: string }>;
}>;

type ClusterParam = { kind: 'ok'; cluster: ServerCluster } | { kind: 'invalid' };

export async function GET(request: NextRequest, props: Props) {
    const { signature } = await props.params;

    if (!isSignatureValid(signature)) {
        return new NextResponse('Invalid transaction signature', { status: 400 });
    }

    const clusterParam = resolveClusterParam(request);
    if (clusterParam.kind === 'invalid') return new NextResponse('Invalid cluster', { status: 400 });

    try {
        const result = await getTxShareData(signature, clusterParam.cluster);

        // OG data is recommended to be fast, hence rpc budget timeout.
        // Testnet timeouts are handled separately - we render a "not available" card.
        if (result.kind === 'rpc-budget-timeout' && clusterParam.cluster !== Cluster.Testnet) {
            return new NextResponse('Transaction request timed out due to budget limit', { status: 504 });
        }
        if (result.kind === 'error') return new NextResponse('Failed to fetch transaction data', { status: 502 });

        const [fonts, glows] = await Promise.all([loadOgFonts(FONTS_TO_LOAD), loadOgGlows()]);
        // Return cached "not available" card for testnet timeouts.
        if (result.kind === 'rpc-budget-timeout') {
            return await pngImageResponse(
                <TxImageNotAvailable glows={glows} signature={signature} />,
                fonts,
                FALLBACK_CACHE_DURATION,
            );
        }

        // A missing transaction still renders: BaseTxImage draws its own fallback, so a stale link unfurls as
        // a branded card instead of a broken image.
        const data = result.kind === 'ok' ? result.data : undefined;

        return await pngImageResponse(
            <BaseTxImage data={data} glows={glows} signature={signature} />,
            fonts,
            data ? RESOLVED_CACHE_DURATION : FALLBACK_CACHE_DURATION,
        );
    } catch (e) {
        Logger.error(new Error('[og:tx] Failed to generate image', { cause: e }), { sentry: true, signature });
        return new NextResponse('Failed to process request', { status: 500 });
    }
}

async function pngImageResponse(
    card: ReactElement,
    fonts: Awaited<ReturnType<typeof loadOgFonts>>,
    cacheDuration: number,
): Promise<NextResponse> {
    const imageBuffer = await new ImageResponse(card, { ...IMAGE_SIZE, fonts }).arrayBuffer();

    return new NextResponse(imageBuffer, {
        headers: { ...cacheHeaders(cacheDuration), 'Content-Type': 'image/png' },
    });
}

function cacheHeaders(duration: number) {
    return { 'Cache-Control': `public, max-age=${duration}, s-maxage=${duration}, stale-while-revalidate=60` };
}

function resolveClusterParam(request: NextRequest): ClusterParam {
    const { search, searchParams } = request.nextUrl;
    const slug = searchParams.get('cluster') ?? undefined;

    // The CDN keys on the whole URL, so a second spelling of one request is a fresh miss - and each miss
    // costs a transaction fetch, an IDL fetch (optional) and a Satori render.
    // Comparing the raw query against the param it parsed to leaves the two shapes `getTxOgImageUrl` emits.
    const canonical = slug === undefined ? '' : `?cluster=${slug}`;
    if (search !== canonical) {
        // Console only, like every refusal a caller can provoke: reporting one would hand anyone a way to
        // raise alerts.
        Logger.warn('[og:tx] Rejected a query that is not the canonical shape');
        return { kind: 'invalid' };
    }

    if (slug === undefined) return { cluster: Cluster.MainnetBeta, kind: 'ok' };

    const cluster = clusterFromSlug(slug);
    // Custom is rejected rather than resolved. Its URL is client-supplied, so honouring it on an
    // unauthenticated route would let a caller aim our server at any host - the reason serverClusterUrl
    // takes ServerCluster at all (app/entities/cluster/lib/cluster.ts:112-115).
    if (cluster === undefined || cluster === Cluster.Custom) return { kind: 'invalid' };

    return { cluster, kind: 'ok' };
}
