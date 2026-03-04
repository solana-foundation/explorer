import * as Sentry from '@sentry/nextjs';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from 'sas-lib';

import Logger from '@/app/utils/logger';

import { CACHE_HEADERS, NO_STORE_HEADERS } from '../../config';

const BLUPRYNT_CREDENTIAL = process.env.BLUPRYNT_CREDENTIAL_AUTHORITY;

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

    if (!BLUPRYNT_CREDENTIAL) {
        return NextResponse.json(
            { error: 'Bluprynt API is misconfigured' },
            { headers: NO_STORE_HEADERS, status: 500 }
        );
    }

    try {
        const connection = new Connection(serverClusterUrl(Cluster.MainnetBeta, ''), 'confirmed');

        // Attestation layout (1-byte discriminator):
        // - 1 byte discriminator (offset 0)
        // - 32 bytes nonce/mint address (offset 1)
        // - 32 bytes credential pubkey (offset 33)
        // - 32 bytes schema pubkey (offset 65)
        const accounts = await connection.getProgramAccounts(new PublicKey(SAS_PROGRAM_ID), {
            dataSlice: { length: 0, offset: 0 },
            filters: [
                { memcmp: { bytes: BLUPRYNT_CREDENTIAL, offset: 33 } },
                { memcmp: { bytes: mintAddress, offset: 1 } },
            ],
        });

        const verified = accounts.length > 0;

        return NextResponse.json({ verified }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error(new Error('Bluprynt verification error', { cause: error }));
        Sentry.captureException(error);
        return NextResponse.json(
            { error: 'Failed to verify bluprynt data' },
            { headers: NO_STORE_HEADERS, status: 500 }
        );
    }
}
