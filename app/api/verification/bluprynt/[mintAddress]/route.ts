import { type Address, address } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';
import { deriveAttestationPda, deriveSchemaPda } from 'sas-lib';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '../../config';
import { BLUPRYNT_CONFIG } from '../config';

const RPC_TIMEOUT_MS = 15_000;
// SAS protocol supports up to 256 schema versions. We decided to use 32 for now.
const MAX_SCHEMA_VERSIONS = 32;

const connection = new Connection(serverClusterUrl(Cluster.MainnetBeta, ''), {
    commitment: 'confirmed',
    fetchMiddleware: (info, init, fetch) => {
        fetch(info, { ...init, signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    },
});

async function getSchemaVersionPdas(credentialAddress: Address, schemaName: string): Promise<Address[]> {
    const versions = await Promise.all(
        Array.from({ length: MAX_SCHEMA_VERSIONS }, (_, version) =>
            deriveSchemaPda({
                credential: credentialAddress,
                name: schemaName,
                version,
            }),
        ),
    );
    return versions.map(([addr]) => addr);
}

type Params = {
    params: Promise<{
        mintAddress: string;
    }>;
};

export async function GET(_request: Request, props: Params) {
    const { mintAddress } = await props.params;

    try {
        new PublicKey(mintAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    try {
        const credentialAddr = address(BLUPRYNT_CONFIG.credentialAuthority);
        const mintAddr = address(mintAddress);

        const schemaPdas = await getSchemaVersionPdas(credentialAddr, BLUPRYNT_CONFIG.schemaName);

        const attestationPdas = await Promise.all(
            schemaPdas.map(schema =>
                deriveAttestationPda({
                    credential: credentialAddr,
                    nonce: mintAddr,
                    schema,
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
