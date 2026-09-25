import { gen } from '@__fixtures__/gen';
import { type Address, getAddressEncoder } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    BPF_LOADER_2_ADDRESS,
    BPF_UPGRADEABLE_LOADER_ADDRESS,
    LOADER_V4_ADDRESS,
    LOADER_V4_HEADER_SIZE,
    NATIVE_LOADER_ADDRESS,
    PROGRAM_DATA_HEADER_SIZE,
} from '../../lib/constants';

const mocks = vi.hoisted(() => ({
    getProgramProvenance: vi.fn(),
    getRpc: vi.fn(),
    programLabel: vi.fn(),
    verifiedBuildState: vi.fn(),
}));

vi.mock('@entities/cluster/server', () => ({ getRpc: mocks.getRpc }));
vi.mock('@utils/tx', async importOriginal => {
    const actual = await importOriginal<typeof import('@utils/tx')>();
    return { ...actual, programLabel: mocks.programLabel };
});
vi.mock('../../api/get-program-provenance', () => ({
    getProgramProvenance: mocks.getProgramProvenance,
    verifiedBuildState: mocks.verifiedBuildState,
}));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { getAccountShareData } from '../get-account-share-data';

const ADDRESS = gen.address(1);
const OWNER = gen.address(2);
const AUTHORITY = gen.address(3);
const PROGRAM_DATA = gen.address(5);

const NO_MARKERS = { idlUploaded: 'no', securityTxt: 'no', verifiedBuild: 'no' };
const NO_PROVENANCE = { idlUploaded: 'no', securityTxt: 'no', verified: { entries: [], kind: 'entries' } };
// 2026-08-26T11:32:13Z -> "Aug 26, 2026" through the real formatter.
const BLOCK_TIME = 1_787_743_933;

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
    mocks.getRpc.mockReturnValue(fakeRpc(accounts, signatures));
}

function walletValue(over: Partial<AccountValue> = {}): AccountValue {
    return {
        data: ['', 'base64'],
        executable: false,
        lamports: 2_039_281_440n,
        owner: OWNER,
        space: 165n,
        ...over,
    };
}

/** A program account's 36-byte payload: a 4-byte enum tag then the 32-byte program-data address. */
function programAccountData(programDataAddress: string): [string, 'base64'] {
    const buffer = Buffer.alloc(36);
    buffer.writeUInt32LE(2, 0); // UpgradeableLoaderState::Program
    Buffer.from(getAddressEncoder().encode(programDataAddress as Address)).copy(buffer, 4);
    return [buffer.toString('base64'), 'base64'];
}

function programValue(over: Partial<AccountValue> = {}): AccountValue {
    return {
        data: programAccountData(PROGRAM_DATA),
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
    mocks.getProgramProvenance.mockResolvedValue(NO_PROVENANCE);
    mocks.verifiedBuildState.mockReturnValue('no');
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
                incomplete: false,
                kind: 'account',
                lastActivity: 'Aug 26, 2026',
                owner: OWNER,
                transactionCount: '2',
                transactionCountIsCapped: false,
            },
            kind: 'ok',
        });
    });

    it('should omit the owner for a system-owned wallet', async () => {
        useRpc({ [ADDRESS]: walletValue({ owner: SYSTEM_PROGRAM_ADDRESS }) }, []);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'account' }, kind: 'ok' });
        expect(result).toHaveProperty('data.owner', undefined);
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
        mocks.getProgramProvenance.mockResolvedValue({ ...NO_PROVENANCE, name: 'Jupiter' });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toEqual({
            data: {
                address: ADDRESS,
                incomplete: false,
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
        mocks.getProgramProvenance.mockResolvedValue({ ...NO_PROVENANCE, name: 'idl-name' });

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

    it('should combine the provenance markers with the computed verified-build result', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 1, space: 45 }),
        });
        mocks.getProgramProvenance.mockResolvedValue({
            idlUploaded: 'yes',
            securityTxt: 'no',
            verified: { entries: [{ is_verified: true, on_chain_hash: 'h', signer: AUTHORITY }], kind: 'entries' },
        });
        mocks.verifiedBuildState.mockReturnValue('yes');

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({
            data: { incomplete: false, markers: { idlUploaded: 'yes', securityTxt: 'no', verifiedBuild: 'yes' } },
        });
    });

    it('should flag the card incomplete when a marker could not be resolved', async () => {
        useRpc({
            [ADDRESS]: programValue(),
            [PROGRAM_DATA]: programDataValue({ authority: AUTHORITY, slot: 1, space: 45 }),
        });
        mocks.getProgramProvenance.mockResolvedValue({ ...NO_PROVENANCE, idlUploaded: 'unknown' });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { incomplete: true, markers: { idlUploaded: 'unknown' } } });
    });

    it('should leave size and authority absent when the program-data account cannot be read', async () => {
        useRpc({ [ADDRESS]: programValue(), [PROGRAM_DATA]: null });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'program' }, kind: 'ok' });
        expect(result).not.toHaveProperty('data.programSize');
        expect(result).not.toHaveProperty('data.upgradeAuthority');
        expect(result).not.toHaveProperty('data.lastDeployedSlot');
    });
});

describe('program loaders', () => {
    it('should size a legacy BPF-loader program from its own account and mark it immutable', async () => {
        useRpc({ [ADDRESS]: programValue({ owner: BPF_LOADER_2_ADDRESS, space: 8_320n }) });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({
            data: { kind: 'program', programSize: '8,320 B', upgradeAuthority: { note: 'Immutable' } },
            kind: 'ok',
        });
        expect(result).not.toHaveProperty('data.lastDeployedSlot');
    });

    it('should hash a legacy BPF-loader program directly so it can be verified against the registry', async () => {
        useRpc({ [ADDRESS]: programValue({ owner: BPF_LOADER_2_ADDRESS, space: 8_320n }) });

        await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        // A legacy program keeps its ELF in the program account, so it is hashed directly (no authority) and
        // handed to the verified-build check - rather than passing `undefined` and always reading "unverified".
        expect(mocks.verifiedBuildState).toHaveBeenCalledWith(expect.anything(), undefined, expect.any(String));
    });

    it('should size a LoaderV4 program past its header and leave the authority undetermined', async () => {
        useRpc({
            [ADDRESS]: programValue({ owner: LOADER_V4_ADDRESS, space: BigInt(LOADER_V4_HEADER_SIZE + 1_048_576) }),
        });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'program', programSize: '1.00 MB' }, kind: 'ok' });
        expect(result).not.toHaveProperty('data.upgradeAuthority');
    });

    it('should show no byte size for a native program and mark it immutable', async () => {
        useRpc({ [ADDRESS]: programValue({ owner: NATIVE_LOADER_ADDRESS, space: 36n }) });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({
            data: { kind: 'program', upgradeAuthority: { note: 'Immutable' } },
            kind: 'ok',
        });
        expect(result).not.toHaveProperty('data.programSize');
    });

    it('should fall back to the account size for an unknown loader without asserting immutability', async () => {
        useRpc({ [ADDRESS]: programValue({ owner: gen.address(7), space: 100n }) });

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'program', programSize: '100 B' }, kind: 'ok' });
        expect(result).not.toHaveProperty('data.upgradeAuthority');
    });
});

describe('not-found card', () => {
    it('should read a missing account with no history as never used', async () => {
        useRpc({ [ADDRESS]: null }, []);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toEqual({ data: { address: ADDRESS, kind: 'not-found', reason: 'never-used' }, kind: 'ok' });
    });

    it('should record that a missing account has history without claiming it was closed', async () => {
        useRpc({ [ADDRESS]: null }, [{ blockTime: BLOCK_TIME }]);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'not-found', reason: 'has-history' }, kind: 'ok' });
    });

    it('should read a missing account whose history lookup failed as unknown', async () => {
        const rpc = {
            getAccountInfo: vi.fn(() => ({ send: () => Promise.resolve({ value: null }) })),
            getSignaturesForAddress: vi.fn(() => ({ send: () => Promise.reject(new Error('rpc down')) })),
        };
        mocks.getRpc.mockReturnValue(rpc);

        const result = await getAccountShareData(ADDRESS, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { kind: 'not-found', reason: 'unknown' }, kind: 'ok' });
    });
});

describe('failures and defaults', () => {
    it('should map an unexpected throw to an error result rather than throwing', async () => {
        mocks.getRpc.mockImplementation(() => {
            throw new Error('boom');
        });

        await expect(getAccountShareData(ADDRESS, Cluster.MainnetBeta)).resolves.toEqual({ kind: 'error' });
    });

    it('should default to the mainnet endpoint when the request carried no cluster', async () => {
        useRpc({ [ADDRESS]: walletValue() }, []);

        const result = await getAccountShareData(ADDRESS);

        expect(mocks.getRpc).toHaveBeenCalledWith(serverClusterUrl(Cluster.MainnetBeta));
        expect(result.kind).toBe('ok');
    });
});
