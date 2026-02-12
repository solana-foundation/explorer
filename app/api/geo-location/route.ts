import { NextRequest, NextResponse } from 'next/server';

import { isEUCountry } from '@/app/entities/geo-location';

export async function GET(request: NextRequest) {
    const country = request.headers.get('x-vercel-ip-country');
    const isEU = isEUCountry(country || undefined);
    return NextResponse.json({ country, isEU });
}
