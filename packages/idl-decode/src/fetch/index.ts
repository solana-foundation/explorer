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

/** Which on-chain publication a fetched IDL came from. */
export enum IdlSource {
    AnchorPda = 'anchor-pda',
    Pmp = 'pmp',
}

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

/** The create+verify tail shared by both fetch routes — every data outcome is a coded-IdlError Result. */
function createVerifiedClient(
    programAddress: string,
    idl: unknown,
    verifyAddress: boolean,
    clientOptions: IdlClientOptions,
): Result<IdlClient> {
    // the requested address doubles as the legacy-conversion address — fetched legacy IDLs mostly declare none
    const [createError, client] = tryCreateIdlClient(idl, { programAddress, ...clientOptions });
    if (createError) return err(createError);
    const declaredAddress = client.programAddress();
    if (verifyAddress && declaredAddress && declaredAddress !== programAddress) {
        return err(new IdlError(IDL_ERROR__IDL_ADDRESS_MISMATCH, { declaredAddress, programAddress }));
    }
    return ok(client);
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
 * only an abort REJECTS, with the abort reason. Use {@link fetchLatestIdlClient} when the
 * publication source matters — an arbitrary fetcher cannot report one.
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

    return createVerifiedClient(programAddress, idl, verifyAddress, clientOptions);
}

/** A fetched decode client together with the publication that produced its IDL. */
export type FetchedIdlClient = {
    client: IdlClient;
    source: IdlSource;
};

/** One publication leg of the latest-IDL policy: how to read it, and which source a hit attributes. */
type FetchLeg = {
    fetch: () => Promise<unknown>;
    source: IdlSource;
};

export type FetchLatestIdlClientOptions = IdlClientOptions &
    LatestIdlFetcherOptions & {
        abortSignal?: AbortSignal;
        rpc: IdlFetcherRpc;
        /** Reject an IDL declaring a DIFFERENT program address (default true). */
        verifyAddress?: boolean;
    };

/**
 * {@link fetchIdlClient} under the latest-IDL policy (PMP first, Anchor PDA fallback) with the
 * winning {@link IdlSource} attributed — one account read per leg. Same contract otherwise: every
 * data outcome is a coded-IdlError Result value; only an abort REJECTS, with the abort reason.
 */
export async function fetchLatestIdlClient(
    programAddress: string,
    options: FetchLatestIdlClientOptions,
): Promise<Result<FetchedIdlClient>> {
    const { abortSignal, anchor = true, authority = null, rpc, verifyAddress = true, ...clientOptions } = options;
    abortSignal?.throwIfAborted();
    const program = assertAddress(programAddress);

    const legs: FetchLeg[] = [
        { fetch: () => fetchPmpIdl(rpc, program, authority, abortSignal), source: IdlSource.Pmp },
        ...(anchor ? [{ fetch: () => fetchAnchorPdaIdl(rpc, program, abortSignal), source: IdlSource.AnchorPda }] : []),
    ];

    for (const leg of legs) {
        let idl: unknown;
        try {
            idl = await leg.fetch();
        } catch (cause) {
            if (abortSignal?.aborted) throw abortSignal.reason;
            // corruption on a leg is surfaced, not masked by the next leg — same policy as createLatestIdlFetcher
            if (isIdlError(cause)) return err(cause);
            return err(new IdlError(IDL_ERROR__IDL_FETCH_FAILED, { cause }));
        }
        if (idl === undefined) continue;

        const [error, client] = createVerifiedClient(programAddress, idl, verifyAddress, clientOptions);
        if (error) return err(error);
        return ok({ client, source: leg.source });
    }

    return err(new IdlError(IDL_ERROR__IDL_NOT_FOUND, { programAddress }));
}
