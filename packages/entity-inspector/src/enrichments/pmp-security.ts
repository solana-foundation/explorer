import { address, createSolanaRpc } from '@solana/kit';
import { fetchMaybeMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';

import type { SupportedCluster } from '../config.js';
import { RPC_REQUEST_TIMEOUT_MS } from '../shared/constants.js';
import { resolveRpcEndpoint } from '../rpc/resolve-rpc-endpoint.js';
import { raceWithTimeout } from '../rpc/timeout.js';

const PMP_SECURITY_SEED = 'security';

/** Canonical PMP `security` metadata content, or null when the seed PDA does not exist. */
export async function fetchPmpSecurityMetadata(
    programAddress: string,
    cluster: SupportedCluster,
    rpcEndpoints: Record<SupportedCluster, string>,
): Promise<string | null> {
    const rpc = createSolanaRpc(resolveRpcEndpoint(cluster, rpcEndpoints));

    const maybeMetadata = await fetchMaybeMetadataFromSeeds(
        rpc,
        {
            authority: null,
            program: address(programAddress),
            seed: PMP_SECURITY_SEED,
        },
        { abortSignal: AbortSignal.timeout(RPC_REQUEST_TIMEOUT_MS) },
    );

    if (!maybeMetadata.exists) return null;

    return await raceWithTimeout(
        unpackAndFetchData({
            rpc,
            ...maybeMetadata.data,
        }),
        RPC_REQUEST_TIMEOUT_MS,
        'PMP unpack',
    );
}
