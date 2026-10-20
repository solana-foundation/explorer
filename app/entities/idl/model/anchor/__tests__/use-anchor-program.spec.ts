// @vitest-environment jsdom

import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { type AnchorIdl } from '../../../lib/types';
import anchor029Devi from '../../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import referenceIdl from '../../../mocks/anchor/reference-0.29.json';
import { formatSerdeIdl, getFormattedIdl } from '../../formatters/format';
import { type SourcedIdl } from '../../idl-candidates';
import { IdlVariant } from '../../idl-variant';
import { getProvider } from '../anchor-provider';
import { useAnchorProgram } from '../use-anchor-program';

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

        const { result } = renderHook(() =>
            useAnchorProgram({ candidates: [anchorCandidate(idl)], programAddress: programId, select, url }),
        );
        expect(result.current?.programId.toString()).toEqual(programId);
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
        const candidates = [anchorCandidate(referenceIdl), anchorCandidate(anchor030devi)];

        const { result } = renderHook(() => useAnchorProgram({ candidates, programAddress, select, url }));

        expect(result.current?.idl.metadata.name).toBe('ammV3');
    });

    it('should return null when no IDL builds a Program', () => {
        const candidates = [anchorCandidate(referenceIdl)];

        const { result } = renderHook(() => useAnchorProgram({ candidates, programAddress, select, url }));

        expect(result.current).toBeNull();
    });

    it('should return null while the IDLs load', () => {
        const { result } = renderHook(() => useAnchorProgram({ candidates: undefined, programAddress, select, url }));

        expect(result.current).toBeNull();
    });

    it('should return the same Program when the candidates do not change', () => {
        const candidates = [anchorCandidate(anchor030devi)];
        const { result, rerender } = renderHook(() => useAnchorProgram({ candidates, programAddress, select, url }));
        const first = result.current;

        rerender();

        expect(result.current).not.toBeNull();
        expect(result.current).toBe(first);
    });
});

function select(candidates: readonly SourcedIdl[]): AnchorIdl[] {
    return candidates.flatMap(candidate => (candidate.standard === 'Anchor' ? [candidate.idl] : []));
}

function anchorCandidate(idl: unknown): SourcedIdl {
    return { idl: idl as AnchorIdl, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' };
}
