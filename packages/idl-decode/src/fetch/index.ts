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
import { createLatestIdlFetcher, type LatestIdlFetcherOptions, resolveOnChainIdl } from './resolve-idl.js';
import { IdlSource, type PublishedIdl } from './solana-idl.js';

export type { IdlFetcherRpc, LatestIdlFetcherOptions };
export { createLatestIdlFetcher, IdlSource };

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
    /** PMP authority that served the IDL — `null` canonical, an address for a fallback; absent off the anchor leg. */
    authority?: Address | null;
    client: IdlClient;
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
 * winning {@link IdlSource} and PMP `authority` attributed. Same contract otherwise: every data
 * outcome is a coded-IdlError Result value; only an abort REJECTS, with the abort reason.
 */
export async function fetchLatestIdlClient(
    programAddress: string,
    options: FetchLatestIdlClientOptions,
): Promise<Result<FetchedIdlClient>> {
    const { abortSignal, anchor, authority, rpc, verifyAddress = true, ...clientOptions } = options;
    abortSignal?.throwIfAborted();
    const program = assertAddress(programAddress);

    let resolved: PublishedIdl | undefined;
    try {
        resolved = await resolveOnChainIdl(rpc, program, { anchor, authority }, abortSignal);
    } catch (cause) {
        if (abortSignal?.aborted) throw abortSignal.reason;
        // a leg's own coded error (corruption → IDL_PARSE_FAILED) — pass it through, don't relabel it a transport failure
        if (isIdlError(cause)) return err(cause);
        return err(new IdlError(IDL_ERROR__IDL_FETCH_FAILED, { cause }));
    }
    if (resolved === undefined) return err(new IdlError(IDL_ERROR__IDL_NOT_FOUND, { programAddress }));

    const [error, client] = createVerifiedClient(programAddress, resolved.idl, verifyAddress, clientOptions);
    if (error) return err(error);
    return ok({
        client,
        source: resolved.source,
        ...('authority' in resolved ? { authority: resolved.authority } : {}),
    });
}
