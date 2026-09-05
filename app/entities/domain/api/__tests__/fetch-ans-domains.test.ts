import { type Address, address } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAnsNameRecordData, makeTldHouseData } from '../../__tests__/fixtures';
import { TLD_HOUSE_PROGRAM_ADDRESS } from '../../lib/ans-name-service';

// Stable keys for deterministic tests
const USER_ADDRESS = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb';
const USER = address(USER_ADDRESS);
const PARENT_ACCOUNT = address('BV9TTYfzBiSMz3JCjqMoHqN62gFJDKPJmRhxjgqKH1N4');
// The real .bonk and .poor TLD house PDAs; fetchTlds verifies each house lives at its canonical PDA.
const BONK_TLD_HOUSE = address('FfCuWsnY8bstAWqY4E4Rk9qRoBcMHykjTwLrjupSpUqu');
const POOR_TLD_HOUSE = address('ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA');
// Reverse-lookup PDA for a name account whose pubkey equals USER_ADDRESS under the .bonk TLD house,
// locked against @onsol/tldparser 0.6.5.
const EXPECTED_REVERSE_PDA = '8Az3w476HXK9hs3ho2sRK3VZeFKaN4gC9yriwG6jBtjh';

const mockGetProgramAccounts = vi.fn();
const mockGetMultipleAccounts = vi.fn();

vi.mock('@utils/cluster', () => ({
    Cluster: { MainnetBeta: 'mainnet-beta' },
    serverClusterUrl: () => 'https://unused.test',
}));

vi.mock('@solana/kit', async importOriginal => {
    const actual = await importOriginal<typeof import('@solana/kit')>();
    return {
        ...actual,
        createSolanaRpc: () => ({
            getMultipleAccounts: mockGetMultipleAccounts,
            getProgramAccounts: mockGetProgramAccounts,
        }),
    };
});

const { fetchAnsDomains } = await import('../fetch-ans-domains');

describe('fetchAnsDomains', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [],
        });
        mockGetMultipleAccounts.mockReturnValue(sendable({ value: [] }));
    });

    it('should return empty array when user has no name accounts', async () => {
        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([]);
        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should return domains with name and address', async () => {
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [makeNameAccount('nameAccount1', PARENT_ACCOUNT)],
        });
        mockGetMultipleAccounts.mockReturnValue(sendable({ value: [makeReverseAccountInfo('alice')] }));

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([
            {
                address: 'nameAccount1',
                name: 'alice.bonk',
            },
        ]);
    });

    it('should filter out accounts whose parent does not match any TLD', async () => {
        const unknownParent = address('6NSfSKTJghNFHy9B9Z5JciDPUJPVKRAm1HGNpksvbfz8');
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [makeNameAccount('nameAccount1', unknownParent)],
        });

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([]);
        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should skip malformed TLD house accounts without failing the whole fetch', async () => {
        setupProgramAccounts({
            tldHouses: [
                { account: { data: toBase64Data(new Uint8Array(50)) }, pubkey: BONK_TLD_HOUSE }, // too short to parse
                makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE),
            ],
            userAccounts: [makeNameAccount('nameAccount1', PARENT_ACCOUNT)],
        });
        mockGetMultipleAccounts.mockReturnValue(sendable({ value: [makeReverseAccountInfo('alice')] }));

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([{ address: 'nameAccount1', name: 'alice.bonk' }]);
    });

    it('should skip reverse-lookup accounts that return null', async () => {
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [
                makeNameAccount('nameAccount1', PARENT_ACCOUNT),
                makeNameAccount('nameAccount2', PARENT_ACCOUNT),
            ],
        });
        mockGetMultipleAccounts.mockReturnValue(
            sendable({
                value: [
                    null, // first account's reverse lookup doesn't exist
                    makeReverseAccountInfo('bob'),
                ],
            }),
        );

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('bob.bonk');
    });

    it('should skip reverse-lookup accounts with empty domain names (only null bytes)', async () => {
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [
                makeNameAccount('nameAccount1', PARENT_ACCOUNT),
                makeNameAccount('nameAccount2', PARENT_ACCOUNT),
            ],
        });
        mockGetMultipleAccounts.mockReturnValue(
            sendable({
                value: [
                    makeReverseAccountInfo(''), // empty name — only null bytes after header
                    makeReverseAccountInfo('alice'),
                ],
            }),
        );

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('alice.bonk');
    });

    it('should strip trailing null bytes from domain names', async () => {
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [makeNameAccount('nameAccount1', PARENT_ACCOUNT)],
        });
        // makeReverseLookupData pads with 10 extra \0 bytes after the name
        mockGetMultipleAccounts.mockReturnValue(sendable({ value: [makeReverseAccountInfo('padded')] }));

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result[0].name).toBe('padded.bonk');
        // Verify no hidden \0 bytes survived — length must match exactly
        expect(result[0].name.length).toBe('padded.bonk'.length);
    });

    it('should batch getMultipleAccounts calls when entries exceed max', async () => {
        const count = 150; // exceeds the 100-account getMultipleAccounts limit
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: Array.from({ length: count }, (_, i) => makeNameAccount(`nameAccount${i}`, PARENT_ACCOUNT)),
        });
        mockGetMultipleAccounts
            .mockReturnValueOnce(
                sendable({ value: Array.from({ length: 100 }, () => makeReverseAccountInfo('domain')) }),
            )
            .mockReturnValueOnce(
                sendable({ value: Array.from({ length: 50 }, () => makeReverseAccountInfo('domain')) }),
            );

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(2);
        expect(mockGetMultipleAccounts.mock.calls[0][0]).toHaveLength(100);
        expect(mockGetMultipleAccounts.mock.calls[1][0]).toHaveLength(50);
        expect(result).toHaveLength(150);
    });

    it('should derive the reverse-lookup PDA from the name account pubkey and TLD house', async () => {
        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [makeNameAccount(USER_ADDRESS, PARENT_ACCOUNT)],
        });
        mockGetMultipleAccounts.mockReturnValue(sendable({ value: [makeReverseAccountInfo('test')] }));

        await fetchAnsDomains(USER_ADDRESS);

        expect(mockGetMultipleAccounts.mock.calls[0][0]).toEqual([EXPECTED_REVERSE_PDA]);
    });

    it('should handle multiple TLDs correctly', async () => {
        const parentPoor = address('6NSfSKTJghNFHy9B9Z5JciDPUJPVKRAm1HGNpksvbfz8');

        setupProgramAccounts({
            tldHouses: [
                makeTldHouseAccount('.poor', parentPoor, POOR_TLD_HOUSE),
                makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE),
            ],
            userAccounts: [
                makeNameAccount('nameAccount1', parentPoor),
                makeNameAccount('nameAccount2', PARENT_ACCOUNT),
            ],
        });
        mockGetMultipleAccounts.mockReturnValue(
            sendable({ value: [makeReverseAccountInfo('alice'), makeReverseAccountInfo('bob')] }),
        );

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        const names = result.map(d => d.name).sort();
        expect(names).toEqual(['alice.poor', 'bob.bonk']);
    });

    it('should skip TLD house accounts not at the canonical PDA for their declared TLD', async () => {
        setupProgramAccounts({
            tldHouses: [
                // Claims to be .bonk but lives at the .poor house address — a spoofed account.
                makeTldHouseAccount('.bonk', PARENT_ACCOUNT, POOR_TLD_HOUSE),
            ],
            userAccounts: [makeNameAccount('nameAccount1', PARENT_ACCOUNT)],
        });

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toEqual([]);
        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should query both programs with their memcmp filters', async () => {
        await fetchAnsDomains(USER_ADDRESS);

        const calls = mockGetProgramAccounts.mock.calls;
        const tldHouseCall = calls.find(([program]) => program === TLD_HOUSE_PROGRAM_ADDRESS);
        const nameRecordCall = calls.find(([program]) => program !== TLD_HOUSE_PROGRAM_ADDRESS);

        expect(tldHouseCall?.[1].filters).toEqual([
            { memcmp: { bytes: 'iQgos3SdaVE', encoding: 'base58', offset: 0n } },
        ]);
        expect(nameRecordCall?.[1].filters).toEqual([
            { memcmp: { bytes: USER_ADDRESS, encoding: 'base58', offset: 40n } },
        ]);
    });

    it('should propagate RPC errors', async () => {
        mockGetProgramAccounts.mockReturnValue({ send: () => Promise.reject(new Error('RPC timeout')) });

        await expect(fetchAnsDomains(USER_ADDRESS)).rejects.toThrow('RPC timeout');
    });

    it('should filter expired domains while keeping active and non-expiring ones', async () => {
        const past = BigInt(Math.floor(Date.now() / 1000) - 46 * 24 * 60 * 60); // 46 days ago — beyond the 45-day grace period
        const future = BigInt(Math.floor(Date.now() / 1000) + 86400);
        const noExpiry = 0n;

        setupProgramAccounts({
            tldHouses: [makeTldHouseAccount('.bonk', PARENT_ACCOUNT, BONK_TLD_HOUSE)],
            userAccounts: [
                makeNameAccount('expiredAccount', PARENT_ACCOUNT, past),
                makeNameAccount('activeAccount', PARENT_ACCOUNT, future),
                makeNameAccount('permanentAccount', PARENT_ACCOUNT, noExpiry),
            ],
        });
        mockGetMultipleAccounts.mockReturnValue(
            sendable({ value: [makeReverseAccountInfo('active'), makeReverseAccountInfo('permanent')] }),
        );

        const result = await fetchAnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        const names = result.map(d => d.name).sort();
        expect(names).toEqual(['active.bonk', 'permanent.bonk']);
        expect(result.find(d => d.address === 'expiredAccount')).toBeUndefined();
    });
});

function sendable<T>(value: T) {
    return { send: () => Promise.resolve(value) };
}

// Routes getProgramAccounts by program: TLD house queries get the TLD list, ANS queries the user's accounts.
function setupProgramAccounts({ tldHouses, userAccounts }: { tldHouses: unknown[]; userAccounts: unknown[] }) {
    mockGetProgramAccounts.mockImplementation((programAddress: string) =>
        sendable(programAddress === TLD_HOUSE_PROGRAM_ADDRESS ? tldHouses : userAccounts),
    );
}

function toBase64Data(data: Uint8Array): [string, string] {
    return [Buffer.from(data).toString('base64'), 'base64'];
}

function makeTldHouseAccount(tldName: string, parentAccount: Address, tldHouse: Address) {
    return { account: { data: toBase64Data(makeTldHouseData(tldName, parentAccount)) }, pubkey: tldHouse };
}

function makeNameAccount(pubkey: string, parentName: Address, expiresAt = 0n) {
    const data = makeAnsNameRecordData({ expiresAt, owner: USER, parentName });
    return { account: { data: toBase64Data(data) }, pubkey };
}

function makeReverseLookupData(domainName: string): Uint8Array {
    const nameBytes = new TextEncoder().encode(domainName);
    // 10 extra bytes become trailing nulls
    const payload = new Uint8Array(nameBytes.length + 10);
    payload.set(nameBytes, 0);
    return makeAnsNameRecordData({ payload });
}

function makeReverseAccountInfo(domainName: string) {
    return { data: toBase64Data(makeReverseLookupData(domainName)) };
}
