import { GenesisHashFromString } from '@entities/chain-id/server';
import { clusterFromParam } from '@entities/cluster/server';
import { isValidCluster, lookupTokenInfos } from '@entities/token-info/server';
import { CLUSTERS } from '@utils/cluster';
import { AddressFromString } from '@validators/pubkey';
import type { NextResponse } from 'next/server';
import { coerce, enums, optional, refine, string, type, validate } from 'superstruct';

import { invalidRequest, toTokenInfosResponse } from '@/app/api/token-info/responses';
import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '@/app/shared/lib/http-utils';

export const maxDuration = 10;

const ClusterFromString = coerce(enums(CLUSTERS), string(), value => clusterFromParam(value) ?? value);

const RequestStruct = refine(
    type({
        cluster: ClusterFromString,
        genesisHash: optional(GenesisHashFromString),
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
    });
    return toTokenInfosResponse(lookup, { error: ERROR_CACHE_HEADERS, resolved: CACHE_HEADERS });
}
