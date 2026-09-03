import type { TransactionConfirmationStatus } from '@solana/web3.js';
import { array, create, Infer, nullable, number, optional, string, type, union } from 'superstruct';

import { buildRpcFilters, type HistoryFilters } from '../lib/history-filters';
import type { HistoryRow } from '../lib/types';

export type GetTransactionsForAddressResult = {
    data: HistoryRow[];
    paginationToken?: string;
};

// Loose `type()` rather than exact `object()`: this is third-party RPC output, and an
// endpoint adding a field must not invalidate an otherwise good page. Every field the
// history table reads is still checked.
const RpcHistoryItem = type({
    blockTime: optional(nullable(number())),
    // Kept as a plain string so an unrecognised status can be dropped per-row rather
    // than failing the whole page — see toConfirmationStatus.
    confirmationStatus: optional(nullable(string())),
    // Matches web3.js `TransactionError = {} | string`, e.g. "InvalidProgramForExecution"
    // or `{ InstructionError: [0, { Custom: 1 }] }`.
    err: optional(nullable(union([string(), type({})]))),
    memo: optional(nullable(string())),
    signature: string(),
    slot: number(),
    transactionIndex: optional(number()),
});

const RpcResult = type({
    data: array(RpcHistoryItem),
    paginationToken: optional(nullable(string())),
});

/**
 * Calls the Triton `getTransactionsForAddress` method directly (it is not part of
 * web3.js). The `signatures` detail level keeps the response shape compatible with the
 * `ConfirmedSignatureInfo`-based history table.
 *
 * Throws a JSON-RPC error carrying `code` when the endpoint reports one, so the caller
 * can classify it (see `isMethodNotFound`).
 */
export async function getTransactionsForAddress({
    url,
    address,
    limit,
    paginationToken,
    filters,
}: {
    url: string;
    address: string;
    limit: number;
    paginationToken?: string;
    filters: HistoryFilters;
}): Promise<GetTransactionsForAddressResult> {
    const params: Record<string, unknown> = {
        limit,
        // The RPC requires an explicit null for "start from the beginning".
        // eslint-disable-next-line unicorn/no-null
        paginationToken: paginationToken ?? null,
        sortOrder: 'desc',
        transactionDetails: 'signatures',
    };
    const rpcFilters = buildRpcFilters(filters);
    if (rpcFilters) params.filters = rpcFilters;

    const response = await fetch(url, {
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'getTransactionsForAddress',
            params: [address, params],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    // Parse the body before consulting the HTTP status: standard RPC nodes return the
    // JSON-RPC "method not found" error with HTTP 200, so checking response.ok first
    // would mask the -32601 code that drives the getSignaturesForAddress fallback.
    const json = await response.json().catch(() => undefined);
    if (json?.error) {
        const error = new Error(json.error.message ?? 'getTransactionsForAddress failed') as Error & {
            code?: number;
        };
        error.code = json.error.code;
        throw error;
    }
    if (!response.ok) {
        throw new Error(`getTransactionsForAddress HTTP ${response.status}`);
    }
    if (!json?.result) {
        throw new Error('getTransactionsForAddress: malformed response');
    }

    const result = create(json.result, RpcResult);
    return {
        data: result.data.map(toHistoryRow),
        paginationToken: result.paginationToken ?? undefined,
    };
}

const CONFIRMATION_STATUSES: readonly TransactionConfirmationStatus[] = ['processed', 'confirmed', 'finalized'];

// web3.js types `err` and `memo` as required `T | null`, so null is the contract here,
// not a stylistic choice.
/* eslint-disable unicorn/no-null */
function toHistoryRow(item: Infer<typeof RpcHistoryItem>): HistoryRow {
    return {
        blockTime: item.blockTime ?? undefined,
        confirmationStatus: toConfirmationStatus(item.confirmationStatus),
        err: item.err ?? null,
        memo: item.memo ?? null,
        signature: item.signature,
        slot: item.slot,
        transactionIndex: item.transactionIndex,
    };
}
/* eslint-enable unicorn/no-null */

// Drops an unrecognised status rather than rejecting the row: the field only drives a
// badge, so a new status name upstream must not cost the user their history.
function toConfirmationStatus(value: string | null | undefined): TransactionConfirmationStatus | undefined {
    return CONFIRMATION_STATUSES.find(status => status === value);
}
