import { NextResponse } from 'next/server';

import { getCodamaIdl } from '@/app/components/instruction/codama/getCodamaIdl';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

export async function GET(
    request: Request,
) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !url) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }
    try {
        const codamaIdl = await getCodamaIdl(programAddress, url);
        return NextResponse.json({ codamaIdl }, {
            headers: CACHE_HEADERS,
            status: 200,
        });
    } catch (error) {
        return NextResponse.json({ details: error, error: error instanceof Error ? error.message : 'Unknown error' }, {
            headers: CACHE_HEADERS,
            status: 200,
        });
    }
}