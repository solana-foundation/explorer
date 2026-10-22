// @vitest-environment jsdom

import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { type AnchorIdl } from '../../../lib/types';
import anchor029Devi from '../../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import referenceIdl from '../../../mocks/anchor/reference-0.29.json';
import { formatSerdeIdl, getFormattedIdl } from '../../formatters/format';
import { IdlVariant } from '../../idl-variant';
import { getAnchorIdls, type SourcedIdl } from '../../sourced-idl';
import { type ProgramIdls } from '../../use-program-idls';
import { getProvider } from '../anchor-provider';
import { useAnchorProgram } from '../use-anchor-program';

const idlState: ProgramIdls = { idls: [] };

// Create a mock provider that matches Anchor's expected structure
const createMockProvider = (mockUrl: string, mockProgramAddress: string) => ({
    connection: {
        commitment: 'confirmed',
        rpcEndpoint: mockUrl,
    },
    opts: {
        preflightCommitment: 'confirmed',
    },
    wallet: {
        publicKey: new PublicKey(mockProgramAddress),
        signAllTransactions: vi.fn(),
        signTransaction: vi.fn(),
    },
});

vi.mock('@entities/idl/model/anchor/anchor-provider', () => ({ getProvider: vi.fn() }));
vi.mock('@entities/idl/model/use-program-idls', () => ({ useProgramIdls: () => idlState }));

describe('Create program instance from legacy idl', () => {
    const url = clusterApiUrl('devnet');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor029Devi, 'any'],
        ['waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF', anchorLegacy094ShankWave, 'any'],
    ])('should create %s program instance; version: $2', (fallbackId: string, idl: any, _version?: string) => {
        const programAddress = idl.metadata?.address ?? fallbackId;
        const programId = programAddress || fallbackId;

        vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programId) as unknown as AnchorProvider);

        expect(() => {
            const formattedIdl = getFormattedIdl(formatSerdeIdl, idl, programId);
            const p = new Program(formattedIdl, getProvider(url));

            expect(programId).toBe(p.programId.toString());
        }).not.toThrowError();
    });
});

describe('Create program instance from idl@0.30+', () => {
    const url = clusterApiUrl('devnet');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor030devi]])(
        'should create %s program instance',
        (fallbackId: string, idl: any) => {
            const programAddress = idl.metadata?.address ?? fallbackId;
            const programId = programAddress || fallbackId;

            vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programId) as unknown as AnchorProvider);

            expect(() => {
                const formattedIdl = idl as Idl;
                const p = new Program(formattedIdl, getProvider(url));
                expect(programId).toBe(p.programId.toString());
            }).not.toThrowError();
        },
    );
});

describe('Allow for useAnchorProgram to create program instance', () => {
    const url = clusterApiUrl('devnet');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor029Devi],
        ['devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', anchor030devi],
        ['waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF', anchorLegacy094ShankWave],
    ])('should create %s program instance via hook', (fallbackId: string, idl: any) => {
        const programId = idl.metadata?.address ?? fallbackId;

        vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programId) as unknown as AnchorProvider);

        idlState.idls = [fromAnchorAccount(idl)];

        const { result } = renderAnchorProgram(programId, url);

        expect(result.current.program?.programId.toString()).toEqual(programId);
    });
});

describe('useAnchorProgram', () => {
    const url = clusterApiUrl('devnet');
    const programAddress = anchor030devi.address;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programAddress) as unknown as AnchorProvider);
    });

    it('should build the Program from the next IDL when the first IDL does not build', () => {
        idlState.idls = [fromAnchorAccount(referenceIdl), fromAnchorAccount(anchor030devi)];

        const { result } = renderAnchorProgram(programAddress, url);

        expect(result.current.program?.idl.metadata.name).toBe('ammV3');
    });

    it('should return no Program when no IDL builds a Program', () => {
        idlState.idls = [fromAnchorAccount(referenceIdl)];

        const { result } = renderAnchorProgram(programAddress, url);

        expect(result.current).toEqual({ isLoading: false, program: null });
    });

    it('should return no Program while the IDLs load', () => {
        idlState.idls = undefined;

        const { result } = renderAnchorProgram(programAddress, url);

        expect(result.current).toEqual({ isLoading: true, program: null });
    });

    it('should return the same Program when the IDLs do not change', () => {
        idlState.idls = [fromAnchorAccount(anchor030devi)];
        const { result, rerender } = renderAnchorProgram(programAddress, url);
        const first = result.current.program;

        rerender();

        expect(result.current.program).not.toBeNull();
        expect(result.current.program).toBe(first);
    });
});

function renderAnchorProgram(programAddress: string, url: string) {
    return renderHook(() => useAnchorProgram({ cluster: Cluster.Devnet, programAddress, select: getAnchorIdls, url }));
}

function fromAnchorAccount(idl: unknown): SourcedIdl {
    return { idl: idl as AnchorIdl, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' };
}
