import { isValidCluster } from '@entities/token-info/server';
import { isAddress } from '@solana/kit';
import { NextResponse } from 'next/server';
import { array, boolean, type Infer, is, number, optional, refine, string, type } from 'superstruct';

import { MAX_ADDRESSES } from './config';
import { invalidRequest, lookupTokenInfos, upstreamRateLimited, upstreamUnavailable } from './lookup-token-infos';

// Platform backstop. One invocation is the Jupiter lookup, then the on-chain fallback's
// chunked RPC reads, then the off-chain logo reads — already bounded as a group by
// `LOGO_BUDGET_MS`. Headroom, not a limit the fallback can hit. Kept inline: Next reads
// route segment config only as literal route exports.
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
    address: optional(AddressStruct),
    addresses: optional(array(AddressStruct)),
    cluster: number(),
    genesisHash: optional(string()),
    includeOnChainFallback: optional(boolean()),
});

type RequestBody = Infer<typeof RequestStruct>;

export async function POST(request: Request) {
    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return invalidRequest();
    }

    if (!is(payload, RequestStruct)) return invalidRequest();

    const { cluster, genesisHash, includeOnChainFallback } = payload;
    const addresses = distinctAddresses(payload);

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
    if (lookup.kind === 'rate-limited') return upstreamRateLimited();
    if (lookup.kind === 'unavailable') return upstreamUnavailable();

    // `content` is always an array; single-address callers read `content[0]`.
    return NextResponse.json({ content: lookup.tokens });
}

/**
 * Reads the requested mints. Accepts a single `address` or an `addresses`
 * array; `address` is kept for the callers that resolve one mint at a time.
 * Answers `undefined` when neither is given, or when the request names more
 * distinct mints than `MAX_ADDRESSES`.
 */
function distinctAddresses({ address, addresses }: RequestBody): string[] | undefined {
    const requested = addresses ?? (address === undefined ? undefined : [address]);
    if (!requested) return undefined;

    // De-duplicate before the cap: one transaction often moves the same mint through several token
    // accounts, and a repeated mint costs one lookup rather than a slot against the limit.
    const unique = Array.from(new Set(requested));
    return unique.length > MAX_ADDRESSES ? undefined : unique;
}
