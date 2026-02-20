import { type ResolvedDomainInfo, resolveDomain } from '@entities/domain/api/resolve-domain';
import Logger from '@utils/logger';
import { NextResponse } from 'next/server';

type Params = {
    params: {
        domain: string;
    };
};

export type FetchedDomainInfo = ResolvedDomainInfo;

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' };

export async function GET(_request: Request, { params: { domain } }: Params) {
    try {
        const domainInfo = await resolveDomain(domain);

        return NextResponse.json(domainInfo, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error(error, `Failed to resolve domain: ${domain}`);
        return NextResponse.json(null, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    }
}
