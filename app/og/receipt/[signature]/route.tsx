import { BaseReceiptImage, createReceipt, OG_IMAGE_SIZE } from '@features/receipt';
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

import { ifNoneMatchMatches, notModifiedResponse } from '@/app/shared/lib/http-utils';
import Logger from '@/app/utils/logger';

export const runtime = 'edge';

const CACHE_DURATION = 30 * 60; // 30 minutes
const DEFAULT_CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

type Props = Readonly<{
    params: { signature: string };
}>;

export async function GET(request: NextRequest, { params }: Props) {
    const { signature } = params;

    if (!signature) return new Response('Signature is required', { status: 400 });

    const etag = createEtag(signature);
    const cacheHeaders = getCacheHeaders();

    if (ifNoneMatchMatches(request.headers, etag)) return notModifiedResponse({ cacheHeaders, etag });

    try {
        const receipt = await createReceipt(signature);

        const imageResponse = new ImageResponse(<BaseReceiptImage data={receipt} />, {
            ...OG_IMAGE_SIZE,
        });
        const imageBuffer = await imageResponse.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: { ...cacheHeaders, 'Content-Type': 'image/png', ETag: etag },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        Logger.error(`Failed to process receipt for signature ${signature}: ${message}`, e);
        const status = statusFromError(message);
        const body = status === 404 ? 'Receipt not found' : 'Failed to process request';
        return new NextResponse(body, { status });
    }
}

function statusFromError(message: string): number {
    if (message === 'Transaction not found' || message === 'Cluster not found') return 404;
    if (message === 'Failed to fetch transaction') return 502;
    return 500;
}

function createEtag(signature: string): string {
    return `"${signature}"`;
}

function getCacheHeaders(): Record<string, string> {
    const custom = process.env.RECEIPT_CACHE_HEADERS;
    if (!custom) return { ...DEFAULT_CACHE_HEADERS };
    return { 'Cache-Control': custom };
}
