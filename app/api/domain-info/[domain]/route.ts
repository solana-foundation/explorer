import { type ResolvedDomainInfo, resolveDomain } from '@entities/domain/api/resolve-domain';
import Logger from '@utils/logger';
import { NextResponse } from 'next/server';

type Params = {
    params: {
        domain: string;
    };
};

export type FetchedDomainInfo = ResolvedDomainInfo;

export async function GET(_request: Request, { params: { domain } }: Params) {
    try {
        const domainInfo = await resolveDomain(domain);

        return NextResponse.json(domainInfo, {
            headers: {
                'Cache-Control': 'max-age=86400',
            },
        });
    } catch (error) {
        Logger.error(error, `Failed to resolve domain: ${domain}`);
        return NextResponse.json(null, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    }
}
