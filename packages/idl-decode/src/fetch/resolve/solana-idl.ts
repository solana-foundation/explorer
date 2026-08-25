// The single place @solana/idl's conventions are flipped to ours: it types the whole rpc client and
// threads no abort signal, and it reports data outcomes as values while we throw coded IdlErrors.
import { type IdlResult, parseIdl, type PmpIdlResult, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { IDL_ERROR__IDL_FETCH_FAILED, IDL_ERROR__IDL_PARSE_FAILED, IdlError } from '../../errors.js';
import type { IdlFetcherRpc } from '../../types.js';

/** Which publication served the IDL, NOT its format — PMP content is often Anchor-format (`IdlStandard`). */
export const IdlSource = { Anchor: 'anchor', Pmp: 'pmp' } as const;
export type IdlSource = (typeof IdlSource)[keyof typeof IdlSource];

/** A resolved IDL, the publication that served it, and — PMP only — the authority that held it. */
export type PublishedIdl = {
    /** The account it came from: the derived PDA, or the buffer address that was read. */
    address: Address;
    authority?: Address | null;
    idl: unknown;
    source: IdlSource;
};

/** Binds the caller's abort signal to the account reads, which upstream never threads itself. */
export function toIdlRpc(rpc: IdlFetcherRpc, abortSignal: AbortSignal | undefined): SolanaRpcClient {
    const bound = abortSignal
        ? {
              getAccountInfo: (...args: Parameters<IdlFetcherRpc['getAccountInfo']>) => ({
                  send: (config?: { abortSignal?: AbortSignal }) =>
                      rpc.getAccountInfo(...args).send({ ...config, abortSignal }),
              }),
          }
        : rpc;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- @solana/idl types the full createSolanaRpc client; its IDL fetchers read accounts and nothing else
    return bound as unknown as SolanaRpcClient;
}

/**
 * A leg's outcome in our terms: `absent` resolves `undefined`, corrupt bytes and content that is no
 * JSON object throw `IDL_ERROR__IDL_PARSE_FAILED` — the fetch route turns those into a Result. The
 * error's `operation` names the leg off the result's own `source`, so it cannot contradict it. Pass
 * `retryablePayload` where upstream's `payload` reason is not a statement about the bytes.
 */
export function toPublishedIdl(
    result: IdlResult | PmpIdlResult,
    { retryablePayload = false }: { retryablePayload?: boolean } = {},
): PublishedIdl | undefined {
    if (result.status === 'absent') return undefined;
    if (result.status === 'corrupt') {
        if (retryablePayload && result.reason === 'payload') {
            throw new IdlError(IDL_ERROR__IDL_FETCH_FAILED, { cause: result.cause });
        }
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, {
            cause: result.cause,
            operation: `${result.source} idl data`,
        });
    }
    const parsed = parseIdl(result.content);
    if (!parsed.ok) {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { operation: `${result.source} idl content` });
    }
    // upstream's `source` verbatim — a value it adds would fail this assignment instead of drifting silently
    return {
        address: result.address,
        idl: parsed.idl,
        source: result.source,
        ...('authority' in result ? { authority: result.authority } : {}),
    };
}
