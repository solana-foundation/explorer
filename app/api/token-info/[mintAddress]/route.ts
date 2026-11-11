import { isValidCluster } from '@entities/token-info/server';
import { AddressFromString } from '@validators/pubkey';
import { NextResponse } from 'next/server';
import { coerce, integer, optional, refine, string, type, validate } from 'superstruct';

import {
    invalidRequest,
    lookupTokenInfos,
    upstreamRateLimited,
    upstreamUnavailable,
} from '@/app/api/token-info/lookup-token-infos';
import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '@/app/shared/lib/http-utils';

export const maxDuration = 30;

const IntegerFromString = coerce(
    integer(),
    refine(string(), 'canonical integer', value => String(Number(value)) === value),
    Number,
);

const RequestStruct = refine(
    type({
        cluster: IntegerFromString,
        genesisHash: optional(string()),
        mintAddress: AddressFromString,
    }),
    'cluster',
    ({ cluster, genesisHash }) => isValidCluster(cluster, genesisHash),
);

type Params = {
    params: Promise<{
        mintAddress: string;
    }>;
};

export async function GET(request: Request, props: Params): Promise<NextResponse> {
    const { mintAddress } = await props.params;
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const [error, parsed] = validate({ ...query, mintAddress }, RequestStruct, { coerce: true });
    if (error) return invalidRequest();

    const lookup = await lookupTokenInfos({
        addresses: [parsed.mintAddress],
        cluster: parsed.cluster,
        genesisHash: parsed.genesisHash,
        includeOnChainFallback: false,
    });
    if (lookup.kind === 'rate-limited') return upstreamRateLimited(ERROR_CACHE_HEADERS);
    if (lookup.kind === 'unavailable') return upstreamUnavailable(ERROR_CACHE_HEADERS);

    return NextResponse.json({ content: lookup.tokens }, { headers: CACHE_HEADERS });
}
