import { NextResponse } from 'next/server';

import { getIsEU } from '@/app/utils/geo-location';

export async function GET() {
    const isEU = getIsEU();
    return NextResponse.json({ isEU });
}
