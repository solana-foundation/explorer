import { serverClusterUrlFromParam } from '@entities/cluster/server';
import { errors } from '@entities/program-metadata/server';
import { isTransientRpcError } from '@solana/idl';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import {
    fetchElfSecurityTxt,
    fetchSecurityTxt,
    type SecurityTxtFields,
    type SecurityTxtSource,
} from '@solana/security-txt';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';
import { isEnvEnabled } from '@/app/utils/env';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * Resolve a program's security.txt for a known cluster via `@solana/security-txt`: the PMP `security`
 * seed (canonical authority only — no fndn fallback) then the legacy Neodyme ELF section. The PMP leg
 * is gated by `NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED`; with it off, only the ELF section is read.
 *
 * Error policy mirrors `/api/idl-latest`: a transient RPC blip → retryable, *uncached* 502 (no page);
 * persistent misconfiguration → Sentry page. Absent / unparseable security.txt is a cacheable 200.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    // The PMP security.txt feature gate lives server-side: include the PMP `security` seed only when on.
    const includePmp = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED);

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const url = serverClusterUrlFromParam(clusterProp);
    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    let programId: Address;
    try {
        programId = address(programAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid program address' }, { status: 400 });
    }

    const context = { cluster: clusterProp, programAddress };

    try {
        const rpc = createSolanaRpc(url);
        let securityTxt: { type: SecurityTxtSource; fields: SecurityTxtFields } | undefined;
        if (includePmp) {
            // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only PMP lookup (no fndn fallback)
            const result = await fetchSecurityTxt(rpc, programId, { authority: null });
            if (result) securityTxt = { fields: result.fields, type: result.type };
        } else {
            const result = await fetchElfSecurityTxt(rpc, programId);
            if (result) securityTxt = { fields: result.fields, type: 'elf' };
        }

        // `securityTxt` omitted (undefined) when absent — the "no security.txt" case, cacheable.
        return NextResponse.json({ securityTxt }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // `@solana/security-txt` surfaces absent/unparseable as a value and throws only on RPC failure.
        // Transient blips → retryable, *uncached* 502 (no page); persistent misconfiguration → Sentry.
        if (isTransientRpcError(error)) {
            Logger.warn('[api:security-txt] RPC error fetching security.txt', {
                ...context,
                rpcError: error instanceof Error ? error.message : String(error),
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        Logger.panic(new Error('[api:security-txt] Request failed', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: errors[500] }, { status: 502 });
    }
}
