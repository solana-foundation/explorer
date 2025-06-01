import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

const CACHE_DURATION = 60 * 60; // 60 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const url = Number(clusterProp) in Cluster && serverClusterUrl(Number(clusterProp) as Cluster, '');

    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    const programId = new PublicKey(programAddress);
    try {
        const provider = new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
        const idl = await Program.fetchIdl<Idl>(programId, provider);
        return NextResponse.json(
            { idl },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    } catch (error) {
        return NextResponse.json(
            { details: error, error: error instanceof Error ? error.message : 'Unknown error' },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    }
}
