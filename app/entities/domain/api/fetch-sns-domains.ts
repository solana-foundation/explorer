import { getHashedName, getNameAccountKey } from '@bonfida/spl-name-service';
import fetch from 'node-fetch';
import { array, is, record, string, unknown } from 'superstruct';

import type { DomainInfo } from '../model/types';
import { SOL_TLD_AUTHORITY } from './constants';

const BONFIDA_API = 'https://sns-api.bonfida.com/v2/user/domains';

export async function fetchSnsDomains(address: string): Promise<DomainInfo[] | undefined> {
    const response = await fetch(`${BONFIDA_API}/${address}`);

    if (response.status === 404) return undefined;

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

const BonfidaResponse = record(string(), unknown());
const DomainNames = array(string());

function parseBonfidaResponse(data: unknown, address: string): string[] {
    if (!is(data, BonfidaResponse) || Array.isArray(data)) {
        throw new Error('Unexpected Bonfida API response format');
    }

    const value = data[address];
    if (value === undefined) return [];

    if (!is(value, DomainNames)) {
        throw new Error('Unexpected Bonfida API response format');
    }

    return value;
}
