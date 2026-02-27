import { getHashedName, getNameAccountKey } from '@bonfida/spl-name-service';

import type { DomainInfo } from '../model/types';
import { SOL_TLD_AUTHORITY } from './constants';

const BONFIDA_API = 'https://sns-api.bonfida.com/v2/user/domains';

export async function fetchSnsDomains(address: string): Promise<DomainInfo[]> {
    const response = await fetch(`${BONFIDA_API}/${address}`);

    if (!response.ok) {
        throw new Error('Failed to fetch domains from Bonfida API');
    }

    const data: unknown = await response.json();
    const domainNames = parseBonfidaResponse(data, address);

    return Promise.all(
        domainNames.map(async name => {
            const hashedName = await getHashedName(name);
            const nameAccountKey = await getNameAccountKey(hashedName, undefined, SOL_TLD_AUTHORITY);
            return { address: nameAccountKey.toBase58(), name: `${name}.sol` };
        })
    );
}

function parseBonfidaResponse(data: unknown, address: string): string[] {
    if (!data || typeof data !== 'object' || !Array.isArray((data as Record<string, unknown>)[address])) {
        throw new Error('Unexpected Bonfida API response format');
    }
    const entries = (data as Record<string, unknown>)[address] as unknown[];
    return entries.filter((name): name is string => typeof name === 'string');
}
