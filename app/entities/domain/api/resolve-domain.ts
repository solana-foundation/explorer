import { getHashedName, getNameAccountKey, getNameOwner } from '@bonfida/spl-name-service';
import { getDomainKey as getANSDomainKey, getNameOwner as getANSNameOwner } from '@onsol/tldparser';
import { Connection } from '@solana/web3.js';
import { MAINNET_BETA_URL } from '@utils/cluster';
import Logger from '@utils/logger';

import { SOL_TLD_AUTHORITY } from './constants';

export type ResolvedDomainInfo = {
    address: string;
    owner: string;
} | null;

// A new Connection is cheap — it's just a config object holding the URL, no socket/TCP is opened
// until an actual RPC call is made. Safe to create per-request in a short-lived API route handler.
export async function resolveDomain(
    domain: string,
    connection: Connection = new Connection(MAINNET_BETA_URL)
): Promise<ResolvedDomainInfo> {
    return domain.endsWith('.sol') ? resolveSnsDomain(domain, connection) : resolveAnsDomain(domain, connection);
}

async function resolveSnsDomain(domain: string, connection: Connection): Promise<ResolvedDomainInfo> {
    try {
        const hashedName = await getHashedName(domain.slice(0, -4)); // remove .sol
        const nameKey = await getNameAccountKey(hashedName, undefined, SOL_TLD_AUTHORITY);
        const registry = await getNameOwner(connection, nameKey);
        return registry && registry.registry.owner
            ? {
                  address: nameKey.toString(),
                  owner: registry.registry.owner.toString(),
              }
            : null;
    } catch (e) {
        Logger.error(e, `Failed to resolve SNS domain: ${domain}`);
        return null;
    }
}

async function resolveAnsDomain(domainTld: string, connection: Connection): Promise<ResolvedDomainInfo> {
    try {
        const derivedDomainKey = await getANSDomainKey(domainTld.toLowerCase());
        const owner = await getANSNameOwner(connection, derivedDomainKey.pubkey);
        return owner
            ? {
                  address: derivedDomainKey.pubkey.toString(),
                  owner: owner.toString(),
              }
            : null;
    } catch (e) {
        Logger.error(e, `Failed to resolve ANS domain: ${domainTld}`);
        return null;
    }
}
