import { createSolanaRpc } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { DAS_REQUEST_TIMEOUT_MS, RPC_REQUEST_TIMEOUT_MS } from './constants.js';
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
            const payload: { result?: unknown; error?: unknown } = await response.json();
            // JSON-RPC-level errors (asset not found, method unsupported) are the normal outcome for
            // non-NFT accounts — null, not a throw, keeps warn logs for genuine transport failures.
            if (payload.error !== undefined) {
                return null;
            }
            return payload.result;
        } catch (error) {
            throw toSourceUnavailableError(error);
        }
    }

    return { fetchAccountInfo, fetchAsset, fetchSignatureStatus, fetchTransaction };
}
