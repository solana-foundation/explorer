import { type ResolvedDomainInfo, resolveDomain } from '@entities/domain/api/resolve-domain';
import { Domain } from '@entities/domain/lib/domain-struct';
import { Logger } from '@/app/shared/lib/logger';
import { NextResponse } from 'next/server';
import { is } from 'superstruct';


type Params = {
    params: {
        domain: string;
    };
};

export type FetchedDomainInfo = ResolvedDomainInfo;

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600' };

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET(_request: Request, { params: { domain } }: Params) {
    if (!is(domain, Domain)) {
        Logger.warn(`Invalid domain input rejected: ${domain}`);
        return NextResponse.json(null, { headers: NO_CACHE_HEADERS, status: 400 });
    }

    try {
        const domainInfo = await resolveDomain(domain);

        return NextResponse.json(domainInfo, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error('[api:domain-info] Failed to resolve domain', { domain, error });
        return NextResponse.json(null, { headers: NO_CACHE_HEADERS, status: 500 });
    }
}
