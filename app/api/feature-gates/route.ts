import { NextResponse } from 'next/server';

import FEATURES from '@/app/utils/feature-gate/featureGates.json';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toUpperCase();
    let features = [...FEATURES];
    if (search) {
        features = FEATURES.filter((feature) =>
            feature.title.toUpperCase().includes(search)
        );
    }

    return NextResponse.json(
        { features },
        { headers: { 'Cache-Control': 'max-age-86400' }, status: 200 }
    );
}
