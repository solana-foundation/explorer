// The fetch entry — resolve a program's IDL by address, whatever standard the program publishes, and
// build a decode client over it. Subpath-gated so the lean core never loads rpc/PMP machinery.
import { type Address, address as assertAddress } from '@solana/kit';

import { type IdlClient, type IdlClientOptions, tryCreateIdlClient } from '../client.js';
import {
    err,
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_FETCH_FAILED,
    IDL_ERROR__IDL_NOT_FOUND,
    IdlError,
    isIdlError,
    ok,
    type Result,
} from '../errors.js';
import type { IdlFetcher, IdlFetcherRpc } from '../types.js';
import { fetchAnchorPdaIdl } from './anchor-pda.js';
import { fetchPmpIdl } from './pmp.js';

export type { IdlFetcherRpc };

export type LatestIdlFetcherOptions = {
    /** Set `false` to skip the Anchor-PDA leg — native/builtin programs cannot have one and some RPCs throw for the derived PDA. */
    anchor?: boolean;
    /** Non-canonical PMP metadata authority; canonical (`null`) by default. */
    authority?: Address | null;
};

/**
 * A program's "latest" IDL: the PMP `idl` metadata first, the Anchor IDL PDA as the fallback.
 * Absent on both legs resolves `undefined`; corrupt data throws typed `IDL_ERROR__IDL_PARSE_FAILED`
 * without falling through (corruption is surfaced, not masked). The signal reaches both legs'
 * account reads; url-sourced PMP payloads go through global fetch and are not signal-bound.
 */
export function createLatestIdlFetcher(rpc: IdlFetcherRpc, options: LatestIdlFetcherOptions = {}): IdlFetcher {
    const { anchor = true, authority = null } = options;
    return async (programAddress, config) => {
        config?.abortSignal?.throwIfAborted();
        const program = assertAddress(programAddress);
        const pmp = await fetchPmpIdl(rpc, program, authority, config?.abortSignal);
        if (pmp !== undefined) return pmp;
        return anchor ? fetchAnchorPdaIdl(rpc, program, config?.abortSignal) : undefined;
    };
}

export type FetchIdlClientOptions = IdlClientOptions & {
    abortSignal?: AbortSignal;
    /** Reject an IDL declaring a DIFFERENT program address (default true) — registries and custom fetchers can serve mislabeled ones. */
    verifyAddress?: boolean;
} & ({ fetcher?: undefined; rpc: IdlFetcherRpc } | { fetcher: IdlFetcher; rpc?: IdlFetcherRpc });

/**
 * Resolve a program's IDL by address and build a decode client over it, whatever standard the
 * program publishes. The fetcher defaults to {@link createLatestIdlFetcher} over `rpc` (pass
 * `fetcher` for any other source). Every data outcome is a coded-IdlError Result value —
 * only an abort REJECTS, with the abort reason.
 */
export async function fetchIdlClient(
    programAddress: string,
    options: FetchIdlClientOptions,
): Promise<Result<IdlClient>> {
    const { abortSignal, fetcher, rpc, verifyAddress = true, ...clientOptions } = options;
    abortSignal?.throwIfAborted();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the options union guarantees `rpc` whenever `fetcher` is absent; TS drops that correlation on destructuring
    const resolveIdl = fetcher ?? createLatestIdlFetcher(rpc as IdlFetcherRpc);

    let idl: unknown;
    try {
        idl = await resolveIdl(programAddress, abortSignal ? { abortSignal } : undefined);
    } catch (cause) {
        // caller-initiated — not a data outcome; the reason (always set once aborted), not whatever wrapper the transport rejected with
        if (abortSignal?.aborted) throw abortSignal.reason;
        // a leg's own coded error (data corruption → IDL_PARSE_FAILED) — pass it through, don't relabel it a transport failure
        if (isIdlError(cause)) return err(cause);
        return err(new IdlError(IDL_ERROR__IDL_FETCH_FAILED, { cause }));
    }
    if (idl === undefined) return err(new IdlError(IDL_ERROR__IDL_NOT_FOUND, { programAddress }));

    // the requested address doubles as the legacy-conversion address — fetched legacy IDLs mostly declare none
    const [createError, client] = tryCreateIdlClient(idl, { programAddress, ...clientOptions });
    if (createError) return err(createError);
    const declaredAddress = client.programAddress();
    if (verifyAddress && declaredAddress && declaredAddress !== programAddress) {
        return err(new IdlError(IDL_ERROR__IDL_ADDRESS_MISMATCH, { declaredAddress, programAddress }));
    }
    return ok(client);
}
