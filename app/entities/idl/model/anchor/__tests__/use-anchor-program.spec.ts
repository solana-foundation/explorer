// @vitest-environment jsdom

import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import anchor030devi from '../../../mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { useProgramIdls } from '../../use-program-idls';
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

// Mock only the dependencies we need to control: the throwaway provider (no real RPC connection) and
// the shared IDL resolver (so the hook gets a fixed IDL without fetching).
vi.mock('@entities/idl/model/anchor/anchor-provider', () => ({ getProvider: vi.fn() }));
vi.mock('@entities/idl/model/use-program-idls', () => ({ useProgramIdls: vi.fn() }));

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

describe('useAnchorProgram', () => {
    const url = clusterApiUrl('devnet');
    const programId = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getProvider).mockReturnValue(createMockProvider(url, programId) as unknown as AnchorProvider);
    });

    it('should build an Anchor Program for a modern Anchor IDL', () => {
        vi.mocked(useProgramIdls).mockReturnValue({
            anchorIdl: anchor030devi as unknown as Idl,
            anchorIdlAddress: undefined,
            isLoading: false,
            programMetadataIdl: undefined,
            programMetadataIdlAddress: undefined,
        });

        const { result } = renderHook(() => useAnchorProgram(programId, url, 2));
        expect(result.current.idl).not.toBeNull();
        expect(result.current.program?.programId.toString()).toEqual(programId);
    });

    it('should not build an Anchor Program for a Codama IDL (incl. converted legacy IDLs)', () => {
        // Legacy IDLs resolve as Codama root nodes via `normalizeAnchorIdl`; the Codama pipeline decodes
        // them, so `useAnchorProgram` must not create an Anchor Program.
        const codamaIdl = { program: { publicKey: programId }, standard: 'codama' } as any;
        vi.mocked(useProgramIdls).mockReturnValue({
            anchorIdl: codamaIdl,
            anchorIdlAddress: undefined,
            isLoading: false,
            programMetadataIdl: undefined,
            programMetadataIdlAddress: undefined,
        });

        const { result } = renderHook(() => useAnchorProgram(programId, url, 2));
        expect(result.current.idl).toBe(codamaIdl);
        expect(result.current.program).toBeNull();
    });
});
