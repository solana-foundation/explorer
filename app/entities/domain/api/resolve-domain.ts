import { createSolanaRpc, type GetAccountInfoApi, getBase64Encoder, type Rpc } from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';

import { decodeAnsNameRecord, getAnsDomainAddress } from '../lib/ans-name-service';
import { decodeNameRegistryOwner, getSnsNameAccount, parseSnsLabel } from '../lib/sns-name-service';
import { getStonkNameAccount, parseStonkLabel } from '../lib/stonk-name-service';
import type { ResolvedDomainInfo } from '../model/resolved-domain-info-schema';

const base64Encoder = getBase64Encoder();

// A new rpc client is cheap — it's just a config object holding the URL, no socket/TCP is opened
// until an actual RPC call is made. Safe to create per-request in a short-lived API route handler.
export async function resolveDomain(
    domain: string,
    rpc: Rpc<GetAccountInfoApi> = createSolanaRpc(serverClusterUrl(Cluster.MainnetBeta)),
): Promise<ResolvedDomainInfo> {
    // SNS/ANS/stonk registries store names hashed in lowercase; mixed-case input must be normalized.
    const normalized = domain.toLowerCase();
    const snsLabel = parseSnsLabel(normalized);
    if (snsLabel !== undefined) return resolveSnsDomain(snsLabel, rpc);
    const stonkLabel = parseStonkLabel(normalized);
    if (stonkLabel !== undefined) return resolveStonkDomain(stonkLabel, rpc);
    // `.sol` names are in the Solana Record Service, not in SPL Name Service.
    if (normalized.endsWith('.sol')) return null;
    return resolveAnsDomain(normalized, rpc);
}

async function resolveSnsDomain(label: string, rpc: Rpc<GetAccountInfoApi>): Promise<ResolvedDomainInfo> {
    const nameKey = await getSnsNameAccount(label);
    const { value: accountInfo } = await rpc.getAccountInfo(nameKey, { encoding: 'base64' }).send();
    if (accountInfo === null) return null;

    const owner = decodeNameRegistryOwner(base64Encoder.encode(accountInfo.data[0]));
    return owner ? { address: nameKey, owner } : null;
}

// stonk•names (stonknames.shop) — a self-owned root under the same SPL Name Service program as
// SNS, registered independently rather than through SNS or ANS. Same account layout as SNS, so
// this reuses decodeNameRegistryOwner directly.
async function resolveStonkDomain(label: string, rpc: Rpc<GetAccountInfoApi>): Promise<ResolvedDomainInfo> {
    const nameKey = await getStonkNameAccount(label);
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
