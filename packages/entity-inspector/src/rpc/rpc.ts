import { createSolanaRpc } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { DAS_REQUEST_TIMEOUT_MS, RPC_REQUEST_TIMEOUT_MS } from '../shared/constants.js';
import { resolveRpcEndpoint } from './resolve-rpc-endpoint.js';
import type {
    AccountProbeEnvelope,
    SignatureStatusEnvelope,
    SignatureStatusValue,
    TransactionProbeEnvelope,
} from './types.js';

export class SourceUnavailableError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'SourceUnavailableError';
    }
}

export function isSourceUnavailableError(error: unknown): error is SourceUnavailableError {
    return error instanceof SourceUnavailableError;
}

function toSourceUnavailableError(error: unknown): SourceUnavailableError {
    if (error instanceof SourceUnavailableError) {
        return error;
    }
    const detail = error instanceof Error ? error.message : String(error);
    return new SourceUnavailableError(`Upstream source is unavailable: ${detail}`, { cause: error });
}

// DAS error codes that mean "this account is simply not an NFT", not a provider outage:
// asset not found (-32000, the provider's not-found code) and method unsupported (-32601). Any
// other code (throttling/internal error carried in a 200 body) throws so the outage stays visible.
const BENIGN_DAS_ERROR_CODES = new Set([-32000, -32601]);

function isBenignDasError(code: number | undefined): boolean {
    return code !== undefined && BENIGN_DAS_ERROR_CODES.has(code);
}

type RpcRequest<TValue> = {
    send: (options?: { abortSignal?: AbortSignal }) => Promise<TValue>;
};

export type AccountInfoRequestOptions = {
    commitment?: 'finalized' | 'confirmed';
    encoding?: 'jsonParsed' | 'json' | 'base64';
};

export type TransactionRequestOptions = {
    commitment?: 'finalized' | 'confirmed';
    encoding?: 'json' | 'jsonParsed' | 'base64' | 'base58';
    maxSupportedTransactionVersion?: number;
};

type SignatureStatusRpcResponse = {
    value: readonly (SignatureStatusValue | null)[];
};

// kit brands its inputs (Address/Signature); the tool passes unvalidated strings on purpose — validity is the classifier's concern.
type LooseSolanaRpc = {
    getAccountInfo: (address: string, config: AccountInfoRequestOptions) => RpcRequest<AccountProbeEnvelope>;
    getTransaction: (signature: string, config: TransactionRequestOptions) => RpcRequest<TransactionProbeEnvelope>;
    getSignatureStatuses: (
        signatures: readonly string[],
        config: { searchTransactionHistory: boolean },
    ) => RpcRequest<SignatureStatusRpcResponse>;
};

function createLooseRpc(endpoint: string): LooseSolanaRpc {
    // oxlint-disable-next-line typescript/consistent-type-assertions -- the one boundary cast that defines the loose contract above
    return createSolanaRpc(endpoint) as unknown as LooseSolanaRpc;
}

async function sendWithTimeout<TValue>(request: RpcRequest<TValue>, timeoutMs: number): Promise<TValue> {
    return await request.send({ abortSignal: AbortSignal.timeout(timeoutMs) });
}

export type RpcClient = {
    fetchAccountInfo: (
        address: string,
        cluster: SupportedCluster,
        options?: AccountInfoRequestOptions,
    ) => Promise<AccountProbeEnvelope>;
    fetchAsset: (address: string, cluster: SupportedCluster) => Promise<unknown>;
    fetchSignatureStatus: (signature: string, cluster: SupportedCluster) => Promise<SignatureStatusEnvelope>;
    fetchTransaction: (
        signature: string,
        cluster: SupportedCluster,
        options?: TransactionRequestOptions,
    ) => Promise<TransactionProbeEnvelope>;
};

export function createRpcClient(rpcEndpoints: Record<SupportedCluster, string>): RpcClient {
    async function fetchAccountInfo(
        address: string,
        cluster: SupportedCluster,
        options?: AccountInfoRequestOptions,
    ): Promise<AccountProbeEnvelope> {
        const rpc = createLooseRpc(resolveRpcEndpoint(cluster, rpcEndpoints));
        try {
            const request = rpc.getAccountInfo(address, {
                commitment: options?.commitment ?? 'finalized',
                encoding: options?.encoding ?? 'jsonParsed',
            });
            return await sendWithTimeout(request, RPC_REQUEST_TIMEOUT_MS);
        } catch (error) {
            throw toSourceUnavailableError(error);
        }
    }

    async function fetchTransaction(
        signature: string,
        cluster: SupportedCluster,
        options?: TransactionRequestOptions,
    ): Promise<TransactionProbeEnvelope> {
        const rpc = createLooseRpc(resolveRpcEndpoint(cluster, rpcEndpoints));
        try {
            const request = rpc.getTransaction(signature, {
                commitment: options?.commitment ?? 'finalized',
                encoding: options?.encoding ?? 'json',
                maxSupportedTransactionVersion: options?.maxSupportedTransactionVersion ?? 0,
            });
            return await sendWithTimeout(request, RPC_REQUEST_TIMEOUT_MS);
        } catch (error) {
            throw toSourceUnavailableError(error);
        }
    }

    async function fetchSignatureStatus(
        signature: string,
        cluster: SupportedCluster,
    ): Promise<SignatureStatusEnvelope> {
        const rpc = createLooseRpc(resolveRpcEndpoint(cluster, rpcEndpoints));
        try {
            const request = rpc.getSignatureStatuses([signature], { searchTransactionHistory: true });
            const result = await sendWithTimeout(request, RPC_REQUEST_TIMEOUT_MS);
            if (result.value.length === 0) {
                throw new SourceUnavailableError('getSignatureStatuses returned empty array (expected 1 element).');
            }
            return { value: result.value[0] ?? null };
        } catch (error) {
            throw toSourceUnavailableError(error);
        }
    }

    async function fetchAsset(address: string, cluster: SupportedCluster): Promise<unknown> {
        const endpoint = resolveRpcEndpoint(cluster, rpcEndpoints);
        try {
            const response = await fetch(endpoint, {
                body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'getAsset', params: { id: address } }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
                signal: AbortSignal.timeout(DAS_REQUEST_TIMEOUT_MS),
            });
            if (!response.ok) {
                throw new SourceUnavailableError('DAS endpoint is unavailable.');
            }
            const payload: { result?: unknown; error?: { code?: number } } = await response.json();
            if (payload.error !== undefined) {
                // "Not an NFT" outcomes (asset not found, method unsupported) → null. Any other code is a
                // real upstream failure (throttling/internal error carried in a 200 body) and must surface
                // as a throw so the caller's warn log fires instead of it looking like "not an NFT".
                if (isBenignDasError(payload.error.code)) {
                    return null;
                }
                throw new SourceUnavailableError(`DAS getAsset returned error code ${String(payload.error.code)}.`);
            }
            return payload.result;
        } catch (error) {
            throw toSourceUnavailableError(error);
        }
    }

    return { fetchAccountInfo, fetchAsset, fetchSignatureStatus, fetchTransaction };
}
