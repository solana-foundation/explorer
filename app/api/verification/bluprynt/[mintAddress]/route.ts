import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from 'sas-lib';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '../../config';

const RPC_TIMEOUT_MS = 15_000;

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

    const credential = process.env.BLUPRYNT_CREDENTIAL_AUTHORITY;

    if (!credential) {
        return NextResponse.json(
            { error: 'Bluprynt API is misconfigured' },
            { headers: ERROR_CACHE_HEADERS, status: 500 },
        );
    }

    try {
        const connection = new Connection(serverClusterUrl(Cluster.MainnetBeta, ''), {
            commitment: 'confirmed',
            fetchMiddleware: (info, init, fetch) => {
                fetch(info, { ...init, signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
            },
        });

        // Attestation layout (1-byte discriminator):
        // - 1 byte discriminator (offset 0)
        // - 32 bytes nonce/mint address (offset 1)
        // - 32 bytes credential pubkey (offset 33)
        // - 32 bytes schema pubkey (offset 65)
        const accounts = await connection.getProgramAccounts(new PublicKey(SAS_PROGRAM_ID), {
            dataSlice: { length: 0, offset: 0 },
            filters: [{ memcmp: { bytes: credential, offset: 33 } }, { memcmp: { bytes: mintAddress, offset: 1 } }],
        });

        const verified = accounts.length > 0;

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
