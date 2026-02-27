import { NextRequest, NextResponse } from 'next/server';

import { isGDPRCountry } from '@/app/entities/geo-location';

export async function GET(request: NextRequest) {
    const country = request.headers.get('x-vercel-ip-country');
    const isEU = isGDPRCountry(country || undefined);
    return NextResponse.json({ country, isEU });
}
