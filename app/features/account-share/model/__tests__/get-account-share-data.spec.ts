import { gen } from '@__fixtures__/gen';
import { type Address, getAddressEncoder } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BPF_UPGRADEABLE_LOADER_ADDRESS } from '../../lib/constants';

const mocks = vi.hoisted(() => ({
    createSolanaRpc: vi.fn(),
    getProgramProvenance: vi.fn(),
    programLabel: vi.fn(),
}));

vi.mock('@solana/kit', async importOriginal => {
    const actual = await importOriginal<typeof import('@solana/kit')>();
    return { ...actual, createSolanaRpc: mocks.createSolanaRpc };
});
vi.mock('@utils/tx', async importOriginal => {
    const actual = await importOriginal<typeof import('@utils/tx')>();
    return { ...actual, programLabel: mocks.programLabel };
});
vi.mock('../../api/get-program-provenance', () => ({ getProgramProvenance: mocks.getProgramProvenance }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { getAccountShareData } from '../get-account-share-data';

const ADDRESS = gen.address(1);
const OWNER = gen.address(2);
const AUTHORITY = gen.address(3);
const PROGRAM_DATA = gen.address(5);

const NO_MARKERS = { idlUploaded: false, securityTxt: false, verifiedBuild: false };
// 2026-08-26T11:32:13Z -> "Aug 26, 2026" through the real formatter.
const BLOCK_TIME = 1_787_743_933;
const PROGRAM_DATA_HEADER_SIZE = 45;

type AccountValue = { data: unknown; executable: boolean; lamports: bigint; owner: string; space: bigint };

/** A fake `@solana/kit` rpc: `getAccountInfo` keyed by address, `getSignaturesForAddress` from one list. */
function fakeRpc(accounts: Record<string, AccountValue | null>, signatures: { blockTime: number | null }[] = []) {
    return {
        getAccountInfo: vi.fn((addr: Address) => ({
            send: () => Promise.resolve({ value: accounts[String(addr)] ?? null }),
        })),
        getSignaturesForAddress: vi.fn((_addr: Address, { limit }: { limit: number }) => ({
            send: () => Promise.resolve(signatures.slice(0, limit)),
        })),
    };
}

function useRpc(accounts: Record<string, AccountValue | null>, signatures: { blockTime: number | null }[] = []) {
    mocks.createSolanaRpc.mockReturnValue(fakeRpc(accounts, signatures));
}

function walletValue(over: Partial<AccountValue> = {}): AccountValue {
    return {
        data: { parsed: {}, program: 'spl-token' },
        executable: false,
        lamports: 2_039_281_440n,
        owner: OWNER,
        space: 165n,
        ...over,
    };
}

function programValue(over: Partial<AccountValue> = {}): AccountValue {
    return {
        data: { parsed: { info: { programData: PROGRAM_DATA }, type: 'program' }, program: 'bpf-upgradeable-loader' },
        executable: true,
        lamports: 1n,
        owner: BPF_UPGRADEABLE_LOADER_ADDRESS,
        space: 36n,
        ...over,
    };
}

/** The 45-byte upgradeable program-data header: enum tag, u64 slot, then an optional 32-byte authority. */
function programDataValue({
    authority,
    slot,
    space,
}: {
    authority?: string;
    slot: number;
    space: number;
}): AccountValue {
    const header = Buffer.alloc(PROGRAM_DATA_HEADER_SIZE);
    header.writeUInt32LE(3, 0); // UpgradeableLoaderState::ProgramData
    header.writeBigUInt64LE(BigInt(slot), 4);
    if (authority) {
        header[12] = 1;
        Buffer.from(getAddressEncoder().encode(authority as Address)).copy(header, 13);
    }
    return {
        data: [header.toString('base64'), 'base64'],
        executable: false,
        lamports: 1n,
        owner: BPF_UPGRADEABLE_LOADER_ADDRESS,
        space: BigInt(space),
    };
}

beforeEach(() => {
    mocks.programLabel.mockReturnValue(undefined);
    mocks.getProgramProvenance.mockResolvedValue({ markers: NO_MARKERS });
});

afterEach(() => vi.clearAllMocks());

describe('account card', () => {
    it('should shape a non-executable account with balance, owner, size and activity', async () => {
        useRpc({ [ADDRESS]: walletValue() }, [{ blockTime: BLOCK_TIME }, { blockTime: BLOCK_TIME - 1 }]);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toEqual({
            data: {
                address: ADDRESS,
                balance: '2.03928144 SOL',
                dataSize: '165 B',
                executable: false,
                kind: 'account',
                lastActivity: 'Aug 26, 2026',
                owner: OWNER,
                transactionCount: '2',
                transactionCountIsCapped: false,
            },
            kind: 'ok',
        });
    });

    it('should cap the transaction count at one page and flag it', async () => {
        const signatures = Array.from({ length: 1_000 }, () => ({ blockTime: BLOCK_TIME }));
        useRpc({ [ADDRESS]: walletValue() }, signatures);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({
            data: { transactionCount: '1,000', transactionCountIsCapped: true },
            kind: 'ok',
        });
    });

    it('should omit activity when the address has no signatures', async () => {
        useRpc({ [ADDRESS]: walletValue() }, []);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'account' }, kind: 'ok' });
        expect(result).toHaveProperty('data.transactionCount', undefined);
        expect(result).toHaveProperty('data.lastActivity', undefined);
    });
});

describe('program card', () => {
    it('should read the deploy slot, authority and size from the program-data account', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 208_871_522, space: 45 + 1_300_234 }),
        });
        mocks.getProgramProvenance.mockResolvedValue({ markers: NO_MARKERS, name: 'Jupiter' });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toEqual({
            data: {
                address: ADDRESS,
                kind: 'program',
                lastDeployedSlot: 208_871_522,
                markers: NO_MARKERS,
                name: 'Jupiter',
                programSize: '1.24 MB',
                upgradeAuthority: { address: AUTHORITY },
            },
            kind: 'ok',
        });
    });

    it('should read a program-data account with no authority as immutable', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ slot: 1, space: 45 }),
        });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { upgradeAuthority: { note: 'Immutable' } }, kind: 'ok' });
        expect(
            (result as { data: { upgradeAuthority: { address?: string } } }).data.upgradeAuthority.address,
        ).toBeUndefined();
    });

    it('should prefer the static registry name over the IDL name', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 1, space: 45 }),
        });
        mocks.programLabel.mockReturnValue('Known Program');
        mocks.getProgramProvenance.mockResolvedValue({ markers: NO_MARKERS, name: 'idl-name' });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { name: 'Known Program' }, kind: 'ok' });
    });

    it('should fall back to the truncated address when nothing names the program', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 1, space: 45 }),
        });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect((result as { data: { name: string } }).data.name).toContain('..');
    });

    it('should pass the provenance markers straight through', async () => {
        const markers = { idlUploaded: true, securityTxt: false, verifiedBuild: true };
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 1, space: 45 }),
        });
        mocks.getProgramProvenance.mockResolvedValue({ markers });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { markers } });
    });
});

describe('not-found card', () => {
    it('should read a missing account with no history as never used', async () => {
        useRpc({ [ADDRESS]: null }, []);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toEqual({ data: { address: ADDRESS, kind: 'not-found', reason: 'never-used' }, kind: 'ok' });
    });

    it('should read a missing account that still has history as closed', async () => {
        useRpc({ [ADDRESS]: null }, [{ blockTime: BLOCK_TIME }]);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'not-found', reason: 'closed' }, kind: 'ok' });
    });
});

describe('failures and defaults', () => {
    it('should map an unexpected throw to an error result rather than throwing', async () => {
        mocks.createSolanaRpc.mockImplementation(() => {
            throw new Error('boom');
        });

        await expect(getAccountShareData(ADDRESS, Cluster.MainnetBeta)).resolves.toEqual({ kind: 'error' });
    });

    it('should default to mainnet when the request carried no cluster', async () => {
        useRpc({ [ADDRESS]: walletValue() }, []);

        const result = await getAccountShareData(ADDRESS);

        expect(mocks.createSolanaRpc).toHaveBeenCalledTimes(1);
        expect(result.kind).toBe('ok');
    });
});
