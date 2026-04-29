import type { Address } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';
import { deriveAttestationPda, deriveSchemaPda } from 'sas-lib';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS, NO_STORE_HEADERS } from '../../config';

const RPC_TIMEOUT_MS = 15_000;
const MAX_SCHEMA_VERSIONS = 32;

// Schema PDA derivation is deterministic and can be cached at module level.
// Key: `${credentialAddress}:${schemaName}`
const schemaVersionCache = new Map<string, string[]>();

// Connection is reused across requests to preserve the underlying HTTP keep-alive pool.
const connection = new Connection(serverClusterUrl(Cluster.MainnetBeta, ''), {
    commitment: 'confirmed',
    fetchMiddleware: (info, init, fetch) => {
        fetch(info, { ...init, signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    },
});

async function getSchemaVersionPdas(credentialAddress: string, schemaName: string): Promise<string[]> {
    const cacheKey = `${credentialAddress}:${schemaName}`;
    const cached = schemaVersionCache.get(cacheKey);
    if (cached) return cached;

    const versions = await Promise.all(
        Array.from({ length: MAX_SCHEMA_VERSIONS }, (_, version) =>
            deriveSchemaPda({
                credential: credentialAddress as Address,
                name: schemaName,
                version,
            }),
        ),
    );

    const pdas = versions.map(([addr]) => addr as string);
    schemaVersionCache.set(cacheKey, pdas);
    return pdas;
}

type Params = {
    params: {
        mintAddress: string;
    };
};

export async function GET(_request: Request, { params: { mintAddress } }: Params) {
    try {
        new PublicKey(mintAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    const credentialAddress = process.env.BLUPRYNT_CREDENTIAL_AUTHORITY;
    const schemaName = process.env.BLUPRYNT_SCHEMA_NAME;

    if (!credentialAddress || !schemaName) {
        return NextResponse.json(
            { error: 'Bluprynt API is misconfigured' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }

    try {
        const schemaPdas = await getSchemaVersionPdas(credentialAddress, schemaName);

        const attestationPdas = await Promise.all(
            schemaPdas.map(schema =>
                deriveAttestationPda({
                    credential: credentialAddress as Address,
                    nonce: mintAddress as Address,
                    schema: schema as Address,
                }),
            ),
        );

        const accountInfos = await connection.getMultipleAccountsInfo(
            attestationPdas.map(([addr]) => new PublicKey(addr)),
        );
        const verified = accountInfos.some(info => info !== null);

        return NextResponse.json({ verified }, { headers: CACHE_HEADERS });
    } catch (error) {
        if (isTimeoutError(error)) {
            Logger.warn('[api:bluprynt] RPC request timed out', { mintAddress, sentry: true });
            return NextResponse.json(
                { error: 'Verification request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }

        Logger.panic(error instanceof Error ? error : new Error('Failed to verify bluprynt data'));
        return NextResponse.json(
            { error: 'Failed to verify bluprynt data' },
            { headers: ERROR_CACHE_HEADERS, status: 500 },
        );
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static#exceptions
function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
}
