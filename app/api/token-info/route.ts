import { getTokenInfos } from '@entities/token-info';
import { Cluster } from '@utils/cluster';
import { NextResponse } from 'next/server';

const CACHE_MAX_AGE = 3600; // 1 hour

export async function POST(request: Request) {
    const { address, cluster } = await request.json();

    if (typeof address !== 'string' || cluster === undefined) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tokens = await getTokenInfos([address], cluster as Cluster, {
        next: { revalidate: CACHE_MAX_AGE },
    });
    return NextResponse.json({ content: tokens[0] });
}
