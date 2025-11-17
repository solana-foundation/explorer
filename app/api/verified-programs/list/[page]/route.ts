import { NextResponse } from 'next/server';

import Logger from '@/app/utils/logger';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const PROGRAM_LIST_CACHE_SECONDS = 300;

type Params = {
    params: {
        page: string;
    };
};

export async function GET(_request: Request, { params: { page } }: Params) {
    try {
        const pageNumber = parseInt(page, 10);

        if (isNaN(pageNumber) || pageNumber < 1 || !Number.isInteger(Number(page))) {
            return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
        }

        const response = await fetch(`${OSEC_REGISTRY_URL}/verified-programs/${pageNumber}`);

        if (!response.ok) {
            Logger.error(`Failed to fetch verified programs page ${pageNumber}: HTTP ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch verified programs' }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, max-age=${PROGRAM_LIST_CACHE_SECONDS}`,
            },
        });
    } catch (error) {
        Logger.error('Error in verified-programs list API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
