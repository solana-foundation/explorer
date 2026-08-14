// The single place @solana/idl's conventions are flipped to ours: it types the whole rpc client and
// threads no abort signal, and it reports data outcomes as values while we throw coded IdlErrors.
import { type IdlResult, parseIdl, type PmpIdlResult, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { IDL_ERROR__IDL_PARSE_FAILED, IdlError } from '../errors.js';
import type { IdlFetcherRpc } from '../types.js';

/** A resolved on-chain IDL with the PMP authority that served it — absent off the anchor leg. */
export type PublishedIdl = {
    authority?: Address | null;
    idl: unknown;
};

/** @solana/idl takes no abort signal, so bind the caller's to the account reads it issues. */
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
 * JSON object throw `IDL_ERROR__IDL_PARSE_FAILED` — the fetch route turns those into a Result.
 */
export function toPublishedIdl(result: IdlResult | PmpIdlResult, operation: string): PublishedIdl | undefined {
    if (result.status === 'absent') return undefined;
    if (result.status === 'corrupt') {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause: result.cause, operation: `${operation} data` });
    }
    const parsed = parseIdl(result.content);
    if (!parsed.ok) {
        throw new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { operation: `${operation} content` });
    }
    return { idl: parsed.idl, ...('authority' in result ? { authority: result.authority } : {}) };
}
