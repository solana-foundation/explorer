import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stable key pair for deterministic tests
const USER_ADDRESS = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb';
const PARENT_ACCOUNT = new PublicKey('BV9TTYfzBiSMz3JCjqMoHqN62gFJDKPJmRhxjgqKH1N4');
const TLD_HOUSE = new PublicKey('6NSfSKTJghNFHy9B9Z5JciDPUJPVKRAm1HGNpksvbfz8');
const NAME_RECORD_HEADER_SIZE = 200;

const mockGetProgramAccounts = vi.fn();
const mockGetMultipleAccountsInfo = vi.fn();

vi.mock('@utils/cluster', () => ({
    Cluster: { MainnetBeta: 'mainnet-beta' },
    serverClusterUrl: () => 'https://unused.test',
}));

vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock('@onsol/tldparser', () => ({
    ANS_PROGRAM_ID: new PublicKey('TLDHkysf5pCnKsVA4gXpNQmy7PSj8ByrtuLwFBFSdvB'),
    MULTIPLE_ACCOUNT_INFO_MAX: 100,
    findTldHouse: (tldName: string) => {
        // Return deterministic keys per TLD name
        if (tldName === '.bonk') return [TLD_HOUSE];
        return [PublicKey.default];
    },
    getAllTld: vi.fn(),
    getHashedName: vi.fn().mockResolvedValue(Buffer.alloc(32)),
    getNameAccountKeyWithBump: vi.fn().mockReturnValue([PublicKey.default, 255]),
}));

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn().mockImplementation(() => ({
            getMultipleAccountsInfo: mockGetMultipleAccountsInfo,
            getProgramAccounts: mockGetProgramAccounts,
        })),
    };
});

const { getAllTld, getHashedName, getNameAccountKeyWithBump } = await import('@onsol/tldparser');

const { fetchAnsDomains } = await import('../fetch-ans-domains');

describe('fetchAnsDomains', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAllTld).mockResolvedValue(makeTlds([{ name: '.bonk', parentAccount: PARENT_ACCOUNT }]));
    });

    it('returns empty array when user has no name accounts', async () => {
        mockGetProgramAccounts.mockResolvedValue([]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([]);
        expect(mockGetMultipleAccountsInfo).not.toHaveBeenCalled();
    });

    it('returns domains with name and address', async () => {
        const nameAccountPubkey = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccountPubkey,
            },
        ]);

        const reversePda = PublicKey.unique();
        vi.mocked(getNameAccountKeyWithBump).mockReturnValue([reversePda, 255]);

        mockGetMultipleAccountsInfo.mockResolvedValue([makeReverseAccountInfo('alice')]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([
            {
                address: nameAccountPubkey.toBase58(),
                name: 'alice.bonk',
            },
        ]);
    });

    it('filters out accounts whose parent does not match any TLD', async () => {
        const unknownParent = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(unknownParent, new PublicKey(USER_ADDRESS)) },
                pubkey: PublicKey.unique(),
            },
        ]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([]);
        expect(mockGetMultipleAccountsInfo).not.toHaveBeenCalled();
    });

    it('skips reverse-lookup accounts that return null', async () => {
        const nameAccount1 = PublicKey.unique();
        const nameAccount2 = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount1,
            },
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount2,
            },
        ]);

        vi.mocked(getNameAccountKeyWithBump)
            .mockReturnValueOnce([PublicKey.unique(), 255])
            .mockReturnValueOnce([PublicKey.unique(), 255]);

        mockGetMultipleAccountsInfo.mockResolvedValue([
            null, // first account's reverse lookup doesn't exist
            makeReverseAccountInfo('bob'),
        ]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('bob.bonk');
    });

    it('skips reverse-lookup accounts with empty domain names (only null bytes)', async () => {
        const nameAccount1 = PublicKey.unique();
        const nameAccount2 = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount1,
            },
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount2,
            },
        ]);

        vi.mocked(getNameAccountKeyWithBump)
            .mockReturnValueOnce([PublicKey.unique(), 255])
            .mockReturnValueOnce([PublicKey.unique(), 255]);

        mockGetMultipleAccountsInfo.mockResolvedValue([
            makeReverseAccountInfo(''), // empty name — only null bytes after header
            makeReverseAccountInfo('alice'),
        ]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('alice.bonk');
    });

    it('strips trailing null bytes from domain names', async () => {
        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: PublicKey.unique(),
            },
        ]);

        vi.mocked(getNameAccountKeyWithBump).mockReturnValue([PublicKey.unique(), 255]);

        // makeReverseLookupData pads with 10 extra \0 bytes after the name
        mockGetMultipleAccountsInfo.mockResolvedValue([makeReverseAccountInfo('padded')]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result[0].name).toBe('padded.bonk');
        // Verify no hidden \0 bytes survived — length must match exactly
        expect(result[0].name.length).toBe('padded.bonk'.length);
    });

    it('batches getMultipleAccountsInfo calls when entries exceed max', async () => {
        const count = 150; // exceeds MULTIPLE_ACCOUNT_INFO_MAX of 100
        const accounts = Array.from({ length: count }, () => ({
            account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
            pubkey: PublicKey.unique(),
        }));

        mockGetProgramAccounts.mockResolvedValue(accounts);
        vi.mocked(getNameAccountKeyWithBump).mockReturnValue([PublicKey.unique(), 255]);

        mockGetMultipleAccountsInfo
            .mockResolvedValueOnce(Array.from({ length: 100 }, () => makeReverseAccountInfo('domain')))
            .mockResolvedValueOnce(Array.from({ length: 50 }, () => makeReverseAccountInfo('domain')));

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(mockGetMultipleAccountsInfo).toHaveBeenCalledTimes(2);
        expect(mockGetMultipleAccountsInfo.mock.calls[0][0]).toHaveLength(100);
        expect(mockGetMultipleAccountsInfo.mock.calls[1][0]).toHaveLength(50);
        expect(result).toHaveLength(150);
    });

    it('hashes each name account pubkey for reverse PDA derivation', async () => {
        const nameAccountPubkey = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(PARENT_ACCOUNT, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccountPubkey,
            },
        ]);

        vi.mocked(getNameAccountKeyWithBump).mockReturnValue([PublicKey.unique(), 255]);
        mockGetMultipleAccountsInfo.mockResolvedValue([makeReverseAccountInfo('test')]);

        await fetchAnsDomains(USER_ADDRESS);

        expect(getHashedName).toHaveBeenCalledWith(nameAccountPubkey.toBase58());
    });

    it('handles multiple TLDs correctly', async () => {
        const parentAbc = PublicKey.unique();
        const parentBonk = PARENT_ACCOUNT;

        vi.mocked(getAllTld).mockResolvedValue(
            makeTlds([
                { name: '.abc', parentAccount: parentAbc },
                { name: '.bonk', parentAccount: parentBonk },
            ])
        );

        const nameAccount1 = PublicKey.unique();
        const nameAccount2 = PublicKey.unique();

        mockGetProgramAccounts.mockResolvedValue([
            {
                account: { data: makeNameAccountData(parentAbc, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount1,
            },
            {
                account: { data: makeNameAccountData(parentBonk, new PublicKey(USER_ADDRESS)) },
                pubkey: nameAccount2,
            },
        ]);

        vi.mocked(getNameAccountKeyWithBump)
            .mockReturnValueOnce([PublicKey.unique(), 255])
            .mockReturnValueOnce([PublicKey.unique(), 255]);

        mockGetMultipleAccountsInfo.mockResolvedValue([makeReverseAccountInfo('alice'), makeReverseAccountInfo('bob')]);

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        const names = result.map(d => d.name).sort();
        expect(names).toEqual(['alice.abc', 'bob.bonk']);
    });

    it('propagates RPC errors', async () => {
        mockGetProgramAccounts.mockRejectedValue(new Error('RPC timeout'));

        await expect(fetchAnsDomains(USER_ADDRESS)).rejects.toThrow('RPC timeout');
    });
});

function makeTlds(tlds: { name: string; parentAccount: PublicKey }[]) {
    return tlds.map(({ name, parentAccount }) => ({
        parentAccount,
        tld: new String(name),
    }));
}

function makeNameAccountData(parentName: PublicKey, owner: PublicKey): Buffer {
    // Layout: [8 discriminator][32 parentName][32 owner][...]
    const data = Buffer.alloc(128);
    parentName.toBuffer().copy(new Uint8Array(data.buffer), 8);
    owner.toBuffer().copy(new Uint8Array(data.buffer), 40);
    return data;
}

function makeReverseLookupData(domainName: string): Buffer {
    const nameBytes = Buffer.from(domainName);
    const data = Buffer.alloc(NAME_RECORD_HEADER_SIZE + nameBytes.length + 10); // extra bytes become trailing nulls
    nameBytes.copy(new Uint8Array(data.buffer), NAME_RECORD_HEADER_SIZE);
    return data;
}

function makeReverseAccountInfo(domainName: string) {
    return {
        data: makeReverseLookupData(domainName),
        executable: false,
        lamports: 1_000_000,
        owner: PublicKey.default,
        rentEpoch: 0,
    };
}
