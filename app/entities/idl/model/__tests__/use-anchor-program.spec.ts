import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import anchor029Devi from '../../mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchor030devi from '../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacy094ShankWave from '../../mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import { getProvider } from '../anchor-provider';
import { formatSerdeIdl, getFormattedIdl } from '../formatters/format';
import { useAnchorProgram } from '../use-anchor-program';
import { useProgramIdls } from '../use-program-idls';

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

// Mock only the dependencies we need to control: the throwaway provider (no real RPC connection) and
// the shared IDL resolver (so the hook gets a fixed IDL without fetching).
vi.mock('@entities/idl/model/anchor-provider', () => ({ getProvider: vi.fn() }));
vi.mock('@entities/idl/model/use-program-idls', () => ({ useProgramIdls: vi.fn() }));

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

        vi.mocked(useProgramIdls).mockReturnValue({
            anchorIdl: idl,
            anchorIdlAddress: undefined,
            isLoading: false,
            programMetadataIdl: undefined,
            programMetadataIdlAddress: undefined,
        });
        vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programId) as unknown as AnchorProvider);

        const { result } = renderHook(() => useAnchorProgram(programId, url, 2));
        expect(result.current.idl).not.toBeNull();
        expect(result.current.program?.programId.toString()).toEqual(programId);
    });
});
