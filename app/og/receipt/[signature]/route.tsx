import {
    BaseReceiptImage,
    createReceipt,
    isReceiptEnabled,
    OG_IMAGE_SIZE,
    parseCompositeSignature,
    ReceiptError,
} from '@features/receipt';
import { assertIsSignature } from '@solana/kit';
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

import Logger from '@/app/utils/logger';

// export const runtime = 'edge';

const CACHE_DURATION = 30 * 60; // 30 minutes
const DEFAULT_CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

type Props = Readonly<{
    params: { signature: string };
}>;

export async function GET(request: NextRequest, { params }: Props) {
    const { signature: compositeSignature } = params;
    const { signature, cluster } = parseCompositeSignature(compositeSignature);

    if (!isReceiptEnabled) return new NextResponse('Not Found', { status: 404 });
    if (!signature) return new Response('Signature is required', { status: 400 });
    if (!isValidSignature(signature)) return new NextResponse('Invalid transaction signature', { status: 400 });

    const cacheHeaders = getCacheHeaders();

    try {
        const receipt = await createReceipt(signature, cluster);

        const imageResponse = new ImageResponse(<BaseReceiptImage data={receipt} />, {
            ...OG_IMAGE_SIZE,
        });
        const imageBuffer = await imageResponse.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: { ...cacheHeaders, 'Content-Type': 'image/png' },
        });
    } catch (e) {
        Logger.error(`Failed to process receipt for signature ${signature}:`, e);

        const status = e instanceof ReceiptError ? e.status : 500;
        const body = status === 404 ? 'Receipt not found' : 'Failed to process request';
        return new NextResponse(body, { status });
    }
}

function getCacheHeaders(): HeadersInit {
    const custom = process.env.RECEIPT_CACHE_HEADERS;
    if (!custom) return { ...DEFAULT_CACHE_HEADERS };
    return { 'Cache-Control': custom };
}

function isValidSignature(signature: string): boolean {
    try {
        assertIsSignature(signature);
        return true;
    } catch {
        return false;
    }
}
