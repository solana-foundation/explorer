import { getCodamaIdl } from '@/app/components/instruction/codama/codamaUtils';
import { NextResponse } from 'next/server';

type Params = {
    params: {
        url: string;
        programAddress: string;
    }
}

const CACHE_DURATION = 30 * 60; // 30 minutes

export async function GET(
    _request: Request,
    { params: { url, programAddress } }: Params
) {
    if (typeof programAddress !== 'string' || typeof url !== 'string') {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }
    try {
        const codamaIdl = await getCodamaIdl(programAddress, url);
        return NextResponse.json({ codamaIdl }, {
            status: 200,
            headers: {
                'Cache-Control': `max-age=${CACHE_DURATION}`,
            }
        });
    } catch (error) {
        return NextResponse.json({ details: error, error: error instanceof Error ? error.message : 'Unknown error' }, {
            status: 500,
            headers: {
                'Cache-Control': `max-age=${CACHE_DURATION}`,
            }
        });
    }
}