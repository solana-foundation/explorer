import { lookupVerifiedTokenInfos } from '@entities/token-info/server';
import { AddressFromString } from '@validators/pubkey';
import type { NextResponse } from 'next/server';
import { array, is, type } from 'superstruct';

import { invalidRequest, toTokenInfosResponse } from '@/app/api/token-info/responses';

export const maxDuration = 10;

const RequestStruct = type({ addresses: array(AddressFromString) });

export async function POST(request: Request): Promise<NextResponse> {
    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return invalidRequest();
    }

    if (!is(payload, RequestStruct)) return invalidRequest();

    return toTokenInfosResponse(await lookupVerifiedTokenInfos({ addresses: payload.addresses }));
}
