import { GenesisHashFromString } from '@entities/chain-id/server';
import { isValidCluster, lookupTokenInfos, TOKEN_INFO_REQUEST_LIMIT } from '@entities/token-info/server';
import { isAddress } from '@solana/kit';
import { NextResponse } from 'next/server';
import { array, boolean, is, number, optional, refine, string, type } from 'superstruct';

import { invalidRequest, toTokenInfosResponse } from './responses';

// `maxDuration` must exceed the Jupiter timeout plus `LOGO_BUDGET_MS`.
// The RPC reads of the on-chain fallback have no timeout, so `maxDuration` is their only bound.
export const maxDuration = 30;

const AddressStruct = refine(string(), 'address', value => isAddress(value));

/**
 * An accepted request body; unknown keys are ignored.
 *
 * Two rules stay outside the struct because they are not shape checks: `cluster` is validated
 * here only as a number, since `isValidCluster` decides whether it resolves a chain id, and the
 * address cap applies after de-duplication.
 */
const RequestStruct = type({
    addresses: array(AddressStruct),
    cluster: number(),
    genesisHash: optional(GenesisHashFromString),
    includeOnChainFallback: optional(boolean()),
});

export async function POST(request: Request) {
    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return invalidRequest();
    }

    if (!is(payload, RequestStruct)) return invalidRequest();

    const { cluster, genesisHash, includeOnChainFallback } = payload;
    const addresses = distinctAddresses(payload.addresses);

    if (!addresses || !isValidCluster(cluster, genesisHash)) {
        return invalidRequest();
    }

    if (addresses.length === 0) {
        return NextResponse.json({ content: [] });
    }

    const lookup = await lookupTokenInfos({
        addresses,
        cluster,
        genesisHash,
        includeOnChainFallback: includeOnChainFallback === true,
    });
    return toTokenInfosResponse(lookup);
}

function distinctAddresses(addresses: string[]): string[] | undefined {
    const unique = Array.from(new Set(addresses));
    return unique.length > TOKEN_INFO_REQUEST_LIMIT ? undefined : unique;
}
