import { createSolanaRpc, type GetAccountInfoApi, getBase64Encoder, type Rpc } from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { type Infer, nullable, string, type } from 'superstruct';

import { decodeAnsNameRecord, getAnsDomainAddress } from '../lib/ans-name-service';
import { decodeNameRegistryOwner, getHashedName, getNameAccountKey } from '../lib/sns-name-service';
import { SOL_TLD_AUTHORITY } from './constants';

export const ResolvedDomainInfoSchema = nullable(
    type({
        address: string(),
        owner: string(),
    }),
);

export type ResolvedDomainInfo = Infer<typeof ResolvedDomainInfoSchema>;

const base64Encoder = getBase64Encoder();

// A new rpc client is cheap — it's just a config object holding the URL, no socket/TCP is opened
// until an actual RPC call is made. Safe to create per-request in a short-lived API route handler.
export async function resolveDomain(
    domain: string,
    rpc: Rpc<GetAccountInfoApi> = createSolanaRpc(serverClusterUrl(Cluster.MainnetBeta)),
): Promise<ResolvedDomainInfo> {
    // SNS/ANS registries store names hashed in lowercase; mixed-case input must be normalized.
    const normalized = domain.toLowerCase();
    return normalized.endsWith('.sol') ? resolveSnsDomain(normalized, rpc) : resolveAnsDomain(normalized, rpc);
}

async function resolveSnsDomain(domain: string, rpc: Rpc<GetAccountInfoApi>): Promise<ResolvedDomainInfo> {
    const hashedName = getHashedName(domain.slice(0, -4)); // remove .sol
    const nameKey = await getNameAccountKey(hashedName, { nameParent: SOL_TLD_AUTHORITY });
    const { value: accountInfo } = await rpc.getAccountInfo(nameKey, { encoding: 'base64' }).send();
    if (accountInfo === null) return null;

    const owner = decodeNameRegistryOwner(base64Encoder.encode(accountInfo.data[0]));
    return owner ? { address: nameKey, owner } : null;
}

async function resolveAnsDomain(domainTld: string, rpc: Rpc<GetAccountInfoApi>): Promise<ResolvedDomainInfo> {
    const derivedDomainKey = await getAnsDomainAddress(domainTld);
    if (!derivedDomainKey) return null;

    const { value: accountInfo } = await rpc.getAccountInfo(derivedDomainKey, { encoding: 'base64' }).send();
    if (accountInfo === null) return null;

    const nameRecord = decodeAnsNameRecord(base64Encoder.encode(accountInfo.data[0]));
    if (!nameRecord?.isValid) return null;

    return nameRecord.owner ? { address: derivedDomainKey, owner: nameRecord.owner } : null;
}
