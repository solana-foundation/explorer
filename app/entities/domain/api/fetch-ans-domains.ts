/**
 * Fetches all ANS (AllDomains Name Service) domains owned by a wallet by reading on-chain data
 * directly, rather than resolving TLD by TLD (which costs 2-3 RPC calls per TLD across ~30 TLDs):
 *
 * 1. One `getProgramAccounts` call filtered by owner (offset 40 in the ANS name record layout)
 *    to get ALL user's name accounts across all TLDs at once.
 * 2. One `getProgramAccounts` call over the TLD house program to map parent accounts to TLD names.
 * 3. For each name account, derive a reverse-lookup PDA (keyed by the TLD house as nameClass),
 *    then batch-fetch them via `getMultipleAccounts` (max 100 per call).
 *    The human-readable domain name lives after the 200-byte header in the reverse-lookup account.
 *
 * Total: ~2-3 RPC calls for a typical wallet.
 */

import {
    type Address,
    address,
    type Base58EncodedBytes,
    createSolanaRpc,
    getBase64Encoder,
    type GetMultipleAccountsApi,
    type GetProgramAccountsApi,
    type Rpc,
} from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';

import {
    ANS_NAME_RECORD_HEADER_SIZE,
    ANS_PROGRAM_ADDRESS,
    decodeAnsNameRecord,
    decodeTldHouse,
    getAnsHashedName,
    getAnsNameAccountKey,
    getTldHouseKey,
    TLD_HOUSE_DISCRIMINATOR,
    TLD_HOUSE_PROGRAM_ADDRESS,
} from '../lib/ans-name-service';

/** getMultipleAccounts accepts at most this many addresses per call. */
const MULTIPLE_ACCOUNTS_BATCH_MAX = 100;

// The TLD house account is itself the PDA that reverse-lookup records use as their name class.
type TldEntry = { tldName: string; parentAccount: Address; tldHouse: Address };

type AnsDomain = { address: string; name: string };

type AnsRpc = Rpc<GetProgramAccountsApi & GetMultipleAccountsApi>;

const base64Encoder = getBase64Encoder();

export async function fetchAnsDomains(userAddress: string): Promise<AnsDomain[]> {
    const rpc = createSolanaRpc(serverClusterUrl(Cluster.MainnetBeta));

    const [userAccounts, tlds] = await Promise.all([
        fetchAllUserNameAccounts(rpc, address(userAddress)),
        fetchTlds(rpc),
    ]);

    if (userAccounts.length === 0) return [];

    const parentToTld = new Map(tlds.map(tld => [tld.parentAccount, tld]));
    const entries = await deriveReverseLookupPdas(userAccounts, parentToTld);

    if (entries.length === 0) return [];

    return fetchDomainNames(rpc, entries);
}

type ReverseLookupEntry = { nameAccountAddress: string; tldName: string; reversePda: Address };

// Derive a reverse-lookup PDA for each name account so we can resolve the human-readable domain name.
async function deriveReverseLookupPdas(
    userAccounts: { pubkey: Address; parentName: Address }[],
    parentToTld: Map<Address, TldEntry>,
): Promise<ReverseLookupEntry[]> {
    const entries = await Promise.all(
        userAccounts.map(async ({ pubkey, parentName }) => {
            const tld = parentToTld.get(parentName);
            if (!tld) return null;

            const hashedName = getAnsHashedName(pubkey);
            const reversePda = await getAnsNameAccountKey(hashedName, { nameClass: tld.tldHouse });
            return { nameAccountAddress: pubkey.toString(), reversePda, tldName: tld.tldName };
        }),
    );

    return entries.filter((e): e is ReverseLookupEntry => e !== null);
}

// Batch-fetch reverse-lookup accounts (max 100 per RPC call) and decode domain names from the on-chain data.
async function fetchDomainNames(rpc: AnsRpc, entries: ReverseLookupEntry[]): Promise<AnsDomain[]> {
    const batches: ReverseLookupEntry[][] = [];
    for (let i = 0; i < entries.length; i += MULTIPLE_ACCOUNTS_BATCH_MAX) {
        batches.push(entries.slice(i, i + MULTIPLE_ACCOUNTS_BATCH_MAX));
    }

    const domainsPerBatch = await Promise.all(
        batches.map(async batch => {
            const { value: accountInfos } = await rpc
                .getMultipleAccounts(
                    batch.map(e => e.reversePda),
                    { encoding: 'base64' },
                )
                .send();

            return accountInfos.flatMap((info, i) => {
                if (!info) return [];

                const record = decodeAnsNameRecord(base64Encoder.encode(info.data[0]));
                if (!record?.name) return [];
                return [{ address: batch[i].nameAccountAddress, name: record.name + batch[i].tldName }];
            });
        }),
    );

    return domainsPerBatch.flat();
}

async function fetchAllUserNameAccounts(
    rpc: AnsRpc,
    user: Address,
): Promise<{ pubkey: Address; parentName: Address }[]> {
    const OWNER_OFFSET = 8n + 32n; // 40

    const accounts = await rpc
        .getProgramAccounts(ANS_PROGRAM_ADDRESS, {
            dataSlice: { length: ANS_NAME_RECORD_HEADER_SIZE, offset: 0 },
            encoding: 'base64',
            filters: [
                { memcmp: { bytes: user.toString() as Base58EncodedBytes, encoding: 'base58', offset: OWNER_OFFSET } },
            ],
        })
        .send();

    return accounts.flatMap(({ pubkey, account }) => {
        const record = decodeAnsNameRecord(base64Encoder.encode(account.data[0]));
        if (!record?.isValid) return [];
        return [{ parentName: record.parentName, pubkey }];
    });
}

async function fetchTlds(rpc: AnsRpc): Promise<TldEntry[]> {
    const accounts = await rpc
        .getProgramAccounts(TLD_HOUSE_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [{ memcmp: { bytes: TLD_HOUSE_DISCRIMINATOR, encoding: 'base58', offset: 0n } }],
        })
        .send();

    const entries = await Promise.all(
        accounts.map(async ({ pubkey, account }) => {
            const tldHouse = decodeTldHouse(base64Encoder.encode(account.data[0]));
            if (!tldHouse) return null;

            // A TLD house must live at the canonical PDA for its declared TLD; anything else is
            // a malformed or spoofed account and must not map domains into the user's list.
            if ((await getTldHouseKey(tldHouse.tld)) !== pubkey) return null;

            return { parentAccount: tldHouse.parentAccount, tldHouse: pubkey, tldName: tldHouse.tld };
        }),
    );

    return entries.filter((e): e is TldEntry => e !== null);
}
