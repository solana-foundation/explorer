// On-chain IDL resolution seam over @explorer/idl-decode: one fetch across the publications
// (PMP canonical → fndn fallback → anchor PDA) with the winning source attributed by the package.
import {
    getIdlStandard,
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_FETCH_FAILED,
    IDL_ERROR__IDL_NOT_FOUND,
    type IdlClient,
    type IdlError,
} from '@explorer/idl-decode';
import {
    type PublishedIdlClient,
    fetchOnChainIdlClient,
    type IdlFetcherRpc,
    IdlSource,
} from '@explorer/idl-decode/fetch';
import { createSolanaRpc } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { RPC_REQUEST_TIMEOUT_MS } from '../shared/constants.js';
import { resolveRpcEndpoint } from '../rpc/resolve-rpc-endpoint.js';
import { raceWithTimeout } from '../rpc/timeout.js';
import { PROGRAMS_WITHOUT_ANCHOR_IDL } from './programs-without-anchor-idl.js';
import type { IdlDiscoveryResult, IdlSourceWire } from './types.js';

export type ResolveIdlClient = (programAddress: string, cluster: SupportedCluster) => Promise<IdlClient | null>;

export type ProgramIdlDiscovery = {
    client: IdlClient | null;
    discovery: IdlDiscoveryResult;
};

export type DiscoverProgramIdl = (programAddress: string, cluster: SupportedCluster) => Promise<ProgramIdlDiscovery>;

// kit brands its inputs; the fetcher only needs the GetAccountInfo surface of the full client.
function createIdlRpc(cluster: SupportedCluster, rpcEndpoints: Record<SupportedCluster, string>): IdlFetcherRpc {
    return createSolanaRpc(resolveRpcEndpoint(cluster, rpcEndpoints));
}

type FetchOutcome = { fetched: PublishedIdlClient } | { error: IdlError } | { rejected: unknown };

async function fetchOnChain(programAddress: string, rpc: IdlFetcherRpc): Promise<FetchOutcome> {
    try {
        // The signal binds the account reads only: a url-sourced PMP payload goes through global
        // fetch, so the race is what keeps that leg from stalling the whole response.
        const [error, fetched] = await raceWithTimeout(
            fetchOnChainIdlClient(programAddress, {
                abortSignal: AbortSignal.timeout(RPC_REQUEST_TIMEOUT_MS),
                anchor: !PROGRAMS_WITHOUT_ANCHOR_IDL.has(programAddress),
                rpc,
            }),
            RPC_REQUEST_TIMEOUT_MS,
            'IDL resolution',
        );
        return error ? { error } : { fetched };
    } catch (rejected) {
        // only aborts/timeouts reject — every data outcome is an error-first Result
        return { rejected };
    }
}

// A switch over our own spelling, not a pass-through: an upstream rename of IdlSource is then a compile
// error here instead of a silent change to the wire value.
function toSource(source: IdlSource): IdlSourceWire {
    switch (source) {
        case IdlSource.Pmp:
            return 'pmp';
        case IdlSource.Anchor:
            return 'anchor';
    }
}

function toFoundDiscovery(fetched: PublishedIdlClient): IdlDiscoveryResult {
    return {
        // Legacy (pre-0.30) IDLs convert to Codama at client creation and report as codama here.
        idl_type: getIdlStandard(fetched.client.idl),
        program_name: fetched.client.programName() ?? null,
        source: toSource(fetched.source),
        status: 'found',
        ...('authority' in fetched ? { authority: fetched.authority } : {}),
    };
}

// The coded fields only, never the error itself: a transport `cause` can carry the key-bearing rpc
// endpoint, and `IdlError`'s own message is built from the package's codes and addresses.
function toLoggedError({ code, message }: IdlError): { code: number; message: string } {
    return { code, message };
}

function toErrorDiscovery(error: IdlError): IdlDiscoveryResult {
    switch (error.code) {
        case IDL_ERROR__IDL_NOT_FOUND:
            return { status: 'not_found' };
        case IDL_ERROR__IDL_FETCH_FAILED:
            return { reason: 'source_unavailable', status: 'unknown' };
        case IDL_ERROR__IDL_ADDRESS_MISMATCH:
            return { reason: 'address_unverified', status: 'unknown' };
        default:
            return { reason: 'idl_invalid', status: 'unknown' };
    }
}

/** Resolver for the decode cascade — every failure resolves `null`, never rejects. */
export function createIdlClientResolver(
    rpcEndpoints: Record<SupportedCluster, string>,
    logger: InspectorLogger,
): ResolveIdlClient {
    return async (programAddress, cluster) => {
        const outcome = await fetchOnChain(programAddress, createIdlRpc(cluster, rpcEndpoints));
        if ('fetched' in outcome) {
            return outcome.fetched.client;
        }
        if ('rejected' in outcome) {
            logger.warn(ns('idl client resolution timed out'), { cluster, programAddress });
            return null;
        }
        // the cascade falls back to raw decoding either way, so only "no IDL published" is unremarkable
        if (outcome.error.code !== IDL_ERROR__IDL_NOT_FOUND) {
            logger.warn(ns('idl client resolution failed'), {
                cluster,
                error: toLoggedError(outcome.error),
                programAddress,
            });
        }
        return null;
    };
}

/** Discovery for the program-IDL enrichment — the same fetch, mapped to the wire vocabulary. */
export function createProgramIdlDiscovery(
    rpcEndpoints: Record<SupportedCluster, string>,
    logger: InspectorLogger,
): DiscoverProgramIdl {
    return async (programAddress, cluster) => {
        const outcome = await fetchOnChain(programAddress, createIdlRpc(cluster, rpcEndpoints));
        if ('fetched' in outcome) {
            return { client: outcome.fetched.client, discovery: toFoundDiscovery(outcome.fetched) };
        }
        if ('rejected' in outcome) {
            logger.warn(ns('program idl discovery timed out'), { cluster, programAddress });
            return { client: null, discovery: { reason: 'source_unavailable', status: 'unknown' } };
        }
        return { client: null, discovery: toErrorDiscovery(outcome.error) };
    };
}
