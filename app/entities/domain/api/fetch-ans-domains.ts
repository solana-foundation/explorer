/**
 * Fetches all ANS (AllDomains Name Service) domains owned by a wallet.
 *
 * We intentionally bypass `TldParser.getParsedAllUserDomains()` from @onsol/tldparser because it
 * iterates over every TLD sequentially, making 2-3 RPC calls per TLD with artificial delays.
 * With ~30 TLDs that's 60-90 sequential RPC calls, taking up to 4 minutes.
 *
 * Instead we read on-chain data directly:
 *
 * 1. One `getProgramAccounts` call filtered by owner (offset 40 in the ANS name record layout)
 *    to get ALL user's name accounts across all TLDs at once.
 * 2. One `getAllTld` call to map parent accounts to TLD names.
 * 3. For each name account, derive a reverse-lookup PDA (keyed by tldHouse as nameClass),
 *    then batch-fetch them via `getMultipleAccountsInfo` (max 100 per call).
 *    The human-readable domain name lives after the 200-byte header in the reverse-lookup account.
 *
 * Total: ~2-3 RPC calls instead of ~60-90.
 */

import {
    ANS_PROGRAM_ID,
    findTldHouse,
    getAllTld,
    getHashedName,
    getNameAccountKeyWithBump,
    MULTIPLE_ACCOUNT_INFO_MAX,
    NameRecordHeader,
} from '@onsol/tldparser';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster, serverClusterUrl } from '@utils/cluster';

type SerializedTldInfo = {
    tldName: string;
    parentAccount: string;
    tldHouse: string;
};

type AnsDomain = { address: string; name: string };

export async function fetchAnsDomains(address: string): Promise<AnsDomain[]> {
    const connection = createMainnetConnection();
    const userPublicKey = new PublicKey(address);

    const [userAccounts, tlds] = await Promise.all([
        fetchAllUserNameAccounts(connection, userPublicKey),
        getCachedTlds(),
    ]);

    if (userAccounts.length === 0) return [];

    const parentToTld = buildTldLookup(tlds);
    const entries = await deriveReverseLookupPdas(userAccounts, parentToTld);

    if (entries.length === 0) return [];

    return fetchDomainNames(connection, entries);
}

function createMainnetConnection(): Connection {
    return new Connection(serverClusterUrl(Cluster.MainnetBeta, ''), 'confirmed');
}

function buildTldLookup(tlds: SerializedTldInfo[]): Map<string, SerializedTldInfo> {
    return new Map(tlds.map(tld => [tld.parentAccount, tld]));
}

type ReverseLookupEntry = { nameAccountAddress: string; tldName: string; reversePda: PublicKey };

// Derive a reverse-lookup PDA for each name account so we can resolve the human-readable domain name.
async function deriveReverseLookupPdas(
    userAccounts: { pubkey: PublicKey; parentName: string }[],
    parentToTld: Map<string, SerializedTldInfo>
): Promise<ReverseLookupEntry[]> {
    const entries = await Promise.all(
        userAccounts.map(async ({ pubkey, parentName }) => {
            const tld = parentToTld.get(parentName);
            if (!tld) return null;

            const hashedName = await getHashedName(pubkey.toBase58());
            const [reversePda] = getNameAccountKeyWithBump(hashedName, new PublicKey(tld.tldHouse));
            return { nameAccountAddress: pubkey.toBase58(), reversePda, tldName: tld.tldName };
        })
    );

    return entries.filter((e): e is ReverseLookupEntry => e !== null);
}

// Batch-fetch reverse-lookup accounts (max 100 per RPC call) and decode domain names from the on-chain data.
async function fetchDomainNames(connection: Connection, entries: ReverseLookupEntry[]): Promise<AnsDomain[]> {
    const results: AnsDomain[] = [];

    for (let i = 0; i < entries.length; i += MULTIPLE_ACCOUNT_INFO_MAX) {
        const batch = entries.slice(i, i + MULTIPLE_ACCOUNT_INFO_MAX);
        const accountInfos = await connection.getMultipleAccountsInfo(batch.map(e => e.reversePda));

        for (const [j, info] of accountInfos.entries()) {
            if (!info) continue;

            const record = NameRecordHeader.fromAccountInfo(info);
            const domain = record.pretty().data;
            if (!domain) continue;
            results.push({
                address: batch[j].nameAccountAddress,
                name: domain + batch[j].tldName,
            });
        }
    }

    return results;
}

async function fetchAllUserNameAccounts(
    connection: Connection,
    user: PublicKey
): Promise<{ pubkey: PublicKey; parentName: string }[]> {
    const OWNER_OFFSET = 8 + 32; // 40

    const accounts = await connection.getProgramAccounts(ANS_PROGRAM_ID, {
        filters: [{ memcmp: { bytes: user.toBase58(), offset: OWNER_OFFSET } }],
    });

    return accounts
        .map(({ pubkey, account }) => ({ pubkey, record: NameRecordHeader.fromAccountInfo(account) }))
        .filter(({ record }) => record.isValid)
        .map(({ pubkey, record }) => ({
            parentName: record.parentName.toBase58(),
            pubkey,
        }));
}

async function getCachedTlds(): Promise<SerializedTldInfo[]> {
    const connection = createMainnetConnection();
    const allTlds = await getAllTld(connection);

    return allTlds.map(({ tld, parentAccount }) => {
        const tldName = tld.toString();
        const [tldHouse] = findTldHouse(tldName);
        return { parentAccount: parentAccount.toBase58(), tldHouse: tldHouse.toBase58(), tldName };
    });
}
