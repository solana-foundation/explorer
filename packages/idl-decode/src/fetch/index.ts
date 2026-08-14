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
import { createOnChainIdlFetcher, IdlSource, type OnChainIdlOptions, resolveOnChainIdl } from './resolve/index.js';

export type { IdlFetcherRpc, OnChainIdlOptions };
export { createOnChainIdlFetcher, IdlSource };

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

/** What every fetch route takes: the client's own options, the lookup knobs, and the fetch contract's. */
type FetchIdlOptionsBase = IdlClientOptions &
    OnChainIdlOptions & {
        abortSignal?: AbortSignal;
        /** Reject an IDL declaring a DIFFERENT program address (default true) — registries and custom fetchers can serve mislabeled ones. */
        verifyAddress?: boolean;
    };

/** {@link fetchOnChainIdlClient}'s options: `rpc`, since an on-chain publication is what it reads. */
export type FetchOnChainIdlClientOptions = FetchIdlOptionsBase & { rpc: IdlFetcherRpc };

/** {@link fetchIdlClient}'s options: the same, plus a `fetcher` in place of `rpc` for any other source. */
export type FetchIdlClientOptions = FetchIdlOptionsBase &
    ({ fetcher?: undefined; rpc: IdlFetcherRpc } | { fetcher: IdlFetcher; rpc?: IdlFetcherRpc });

/** Strips the fetch-specific options, leaving what the client itself takes. */
function clientOptionsOf({
    abortSignal: _abortSignal,
    anchor: _anchor,
    authority: _authority,
    fetcher: _fetcher,
    rpc: _rpc,
    verifyAddress: _verifyAddress,
    ...clientOptions
}: FetchIdlClientOptions): IdlClientOptions {
    return clientOptions;
}

/**
 * Runs a resolve step under the fetch contract: an abort REJECTS with its reason, a leg's own coded
 * error passes through, any other throw becomes `IDL_ERROR__IDL_FETCH_FAILED`, and nothing resolved
 * becomes `IDL_ERROR__IDL_NOT_FOUND`. Generic over what a step resolves — an attributed `PublishedIdl`
 * on chain, a raw IDL from a consumer's `fetcher`.
 */
async function resolvedOrErr<T>(
    programAddress: string,
    resolve: () => Promise<T | undefined>,
    abortSignal: AbortSignal | undefined,
): Promise<Result<T>> {
    let published: T | undefined;
    try {
        published = await resolve();
    } catch (cause) {
        // caller-initiated — not a data outcome; the reason (always set once aborted), not whatever wrapper the transport rejected with
        if (abortSignal?.aborted) throw abortSignal.reason;
        // a leg's own coded error (data corruption → IDL_PARSE_FAILED) — pass it through, don't relabel it a transport failure
        if (isIdlError(cause)) return err(cause);
        return err(new IdlError(IDL_ERROR__IDL_FETCH_FAILED, { cause }));
    }
    if (published === undefined) return err(new IdlError(IDL_ERROR__IDL_NOT_FOUND, { programAddress }));
    return ok(published);
}

/** A decode client together with the publication that produced its IDL. */
export type PublishedIdlClient = {
    /** PMP authority that served the IDL — `null` canonical, an address for a fallback; absent off the PMP leg. */
    authority?: Address | null;
    client: IdlClient;
    source: IdlSource;
};

/**
 * Resolve a program's IDL from its on-chain publications and build a decode client over it, with the
 * {@link IdlSource} and PMP `authority` that served it attributed: PMP canonical → fndn fallback, then
 * the Anchor PDA. Every data outcome is a coded-IdlError Result value — only an abort REJECTS, with the
 * abort reason; a malformed `programAddress` throws, since no lookup can be derived from it.
 */
export async function fetchOnChainIdlClient(
    programAddress: string,
    options: FetchOnChainIdlClientOptions,
): Promise<Result<PublishedIdlClient>> {
    const { abortSignal, anchor, authority, rpc, verifyAddress = true } = options;
    abortSignal?.throwIfAborted();
    const program = assertAddress(programAddress);

    const [resolveError, published] = await resolvedOrErr(
        programAddress,
        () => resolveOnChainIdl(rpc, program, { anchor, authority }, abortSignal),
        abortSignal,
    );
    if (resolveError) return err(resolveError);

    const [createError, client] = createVerifiedClient(
        programAddress,
        published.idl,
        verifyAddress,
        clientOptionsOf(options),
    );
    if (createError) return err(createError);
    return ok({
        client,
        source: published.source,
        ...('authority' in published ? { authority: published.authority } : {}),
    });
}

/**
 * The bare decode client, whatever the source: {@link fetchOnChainIdlClient} with the publication
 * envelope dropped, or the IDL a consumer's `fetcher` resolves (a registry, a cache, an anchor-provider
 * wrap) — which reports no publication, so it cannot be attributed. Same Result contract either way.
 */
export async function fetchIdlClient(
    programAddress: string,
    options: FetchIdlClientOptions,
): Promise<Result<IdlClient>> {
    if (options.fetcher === undefined) {
        const [error, published] = await fetchOnChainIdlClient(programAddress, options);
        return error ? err(error) : ok(published.client);
    }
    const { abortSignal, fetcher, verifyAddress = true } = options;
    abortSignal?.throwIfAborted();

    const [error, idl] = await resolvedOrErr(
        programAddress,
        () => fetcher(programAddress, abortSignal ? { abortSignal } : undefined),
        abortSignal,
    );
    if (error) return err(error);
    return createVerifiedClient(programAddress, idl, verifyAddress, clientOptionsOf(options));
}

// Pre-rename names, so callers that learned them keep resolving; drop them once nothing reads them.
export { createOnChainIdlFetcher as createLatestIdlFetcher, fetchOnChainIdlClient as fetchLatestIdlClient };
export type { FetchOnChainIdlClientOptions as FetchLatestIdlClientOptions };
