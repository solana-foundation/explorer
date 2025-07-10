import { NextResponse } from 'next/server';

import { getProgramMetadataIdl } from '@/app/components/instruction/codama/getProgramMetadataIdl';
import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const url = Number(clusterProp) in Cluster && serverClusterUrl(Number(clusterProp) as Cluster, '');

    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    try {
        const codamaIdl = await getProgramMetadataIdl(programAddress, url);
        return NextResponse.json(
            { codamaIdl },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    } catch (error) {
        return NextResponse.json(
            { details: error, error: error instanceof Error ? error.message : 'Unknown error' },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    }
}
