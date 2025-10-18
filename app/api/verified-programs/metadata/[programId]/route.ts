import { NextResponse } from 'next/server';

import Logger from '@/app/utils/logger';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const PROGRAM_METADATA_CACHE_SECONDS = 3600;

type Params = {
    params: {
        programId: string;
    };
};

export async function GET(_request: Request, { params: { programId } }: Params) {
    try {
        if (!programId || programId.length < 32 || programId.length > 44) {
            return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
        }

        const response = await fetch(`${OSEC_REGISTRY_URL}/status-all/${programId}`);

        if (!response.ok) {
            Logger.debug(`Failed to fetch metadata for ${programId}: HTTP ${response.status}`);
            if (response.status === 404) {
                return NextResponse.json([], {
                    headers: {
                        'Cache-Control': `public, max-age=${PROGRAM_METADATA_CACHE_SECONDS}`,
                    },
                });
            }
            return NextResponse.json({ error: 'Failed to fetch program metadata' }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, max-age=${PROGRAM_METADATA_CACHE_SECONDS}`,
            },
        });
    } catch (error) {
        Logger.error(`Error fetching metadata for ${programId}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
