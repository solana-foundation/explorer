import { Cluster } from '@utils/cluster';

import { PROGRAM_INFO_BY_ID } from '@/app/utils/programs';
import verifiedPrograms from '@/public/verified-programs.json';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchContext, SearchOptions, SearchProvider } from '../lib/types';

type VerifiedProgramEntry = {
    address: string;
    name: string;
    repoUrl?: string;
    verifiedAt?: string;
};

const programs: VerifiedProgramEntry[] = verifiedPrograms as VerifiedProgramEntry[];

/**
 * Search provider for OSecure-verified Solana programs.
 *
 * Searches against a pre-built JSON file of verified programs (updated daily
 * via GitHub Action). Matches program name or address, and marks results as
 * verified. Only returns results on mainnet since verification data is
 * mainnet-only.
 */
export const verifiedProgramsSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'verified-programs',
    priority: 65,
    search(query: string, ctx: SearchContext): SearchOptions[] {
        if (query.length < 2) return [];
        if (ctx.cluster !== Cluster.MainnetBeta) return [];

        const q = query.toLowerCase();
        const MAX_RESULTS = 10;
        const matched = programs
            .filter(p => {
                if (p.address in PROGRAM_INFO_BY_ID) return false;
                return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
            })
            .slice(0, MAX_RESULTS);

        if (matched.length === 0) return [];

        return [
            {
                label: SearchGroup.VerifiedPrograms,
                options: matched.map(p => ({
                    label: p.name,
                    pathname: `/address/${p.address}/verified-build`,
                    sublabel: p.address,
                    type: 'address',
                    value: [p.name, p.address],
                    verified: true,
                })),
            },
        ];
    },
};
