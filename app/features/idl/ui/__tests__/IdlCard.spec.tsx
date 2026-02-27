/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import type { Idl } from '@coral-xyz/anchor';
import * as anchorModule from '@entities/idl';
import { Keypair, PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import { GENESIS_HASHES } from '@/app/entities/chain-id';
import * as programMetadataIdlModule from '@/app/entities/program-metadata';
import { ClusterProvider } from '@/app/providers/cluster';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import { IdlCard } from '../IdlCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock('@solana/kit', () => ({
    address: vi.fn((addr: string) => addr),
    createSolanaRpc: vi.fn(() => ({
        getEpochInfo: vi.fn(() => ({
            send: vi.fn().mockResolvedValue({
                absoluteSlot: 0n,
                blockHeight: 0n,
                epoch: 0n,
                slotIndex: 0n,
                slotsInEpoch: 432000n,
            }),
        })),
        getEpochSchedule: vi.fn(() => ({
            send: vi.fn().mockResolvedValue({
                firstNormalEpoch: 0n,
                firstNormalSlot: 0n,
                leaderScheduleSlotOffset: 0n,
                slotsPerEpoch: 432000n,
                warmup: false,
            }),
        })),
        getFirstAvailableBlock: vi.fn(() => ({
            send: vi.fn().mockResolvedValue(0n),
        })),
        getGenesisHash: vi.fn(() => ({
            send: vi.fn().mockResolvedValue(GENESIS_HASHES.MAINNET),
        })),
    })),
}));

const DEFAULT_ADDRESS = PublicKey.default.toBase58();

function createMockAnchorIdl(address = DEFAULT_ADDRESS): Idl {
    return {
        accounts: [],
        address,
        constants: [],
        errors: [],
        events: [],
        instructions: [],
        metadata: {
            name: 'anchor_program',
            spec: '0.1.0',
            version: '0.1.0',
        },
        types: [],
    };
}

function createMockProgramMetadataIdl() {
    return {
        kind: 'rootNode' as const,
        name: 'metadata_program',
        program: {
            accounts: [],
            definedTypes: [],
            errors: [],
            instructions: [],
            pdas: [],
        },
        standard: 'codama',
        version: '1.2.11',
    };
}

describe('IdlCard', () => {
    const programId = DEFAULT_ADDRESS;

    beforeEach(() => {
        vi.clearAllMocks();

        (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
            get: () => clusterSlug(Cluster.MainnetBeta),
            has: (_query?: string) => false,
            toString: () => '',
        });

        (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/');

        (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: vi.fn(),
            refresh: vi.fn(),
            replace: vi.fn(),
        });
    });

    test('should render IdlCard with PMP IDL when programMetadataIdl exists', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: null,
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: createMockProgramMetadataIdl(),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Program Metadata')).toBeInTheDocument();
        });
        expect(screen.getByText(/Program Metadata IDL/)).toBeInTheDocument();
        expect(screen.queryByText(/Anchor IDL/)).not.toBeInTheDocument();
    });

    test('should render IdlCard with Anchor IDL when anchorIdl exists', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: createMockAnchorIdl(),
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: null,
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Anchor')).toBeInTheDocument();
        });
        expect(screen.getByText(/Anchor IDL/)).toBeInTheDocument();
        expect(screen.queryByText(/Program Metadata IDL/)).not.toBeInTheDocument();
    });

    test('should render IdlCard tabs when both IDLs exist', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: createMockAnchorIdl(),
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: createMockProgramMetadataIdl(),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Program Metadata IDL/)).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: 'Anchor' });
        fireEvent.click(button);
        expect(screen.getByText(/Anchor IDL/)).toBeInTheDocument();
    });

    test('should render BaseWarningCard when Anchor IDL address mismatches programId', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: createMockAnchorIdl(Keypair.generate().publicKey.toBase58()), // imitate malicious IDL
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: createMockAnchorIdl(), // but use normal one for PMP program
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );

        // PMP tab is active first
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Anchor' })).toBeInTheDocument();
        });

        // Switch to Anchor tab to trigger the mismatch
        fireEvent.click(screen.getByRole('button', { name: 'Anchor' }));

        expect(screen.getByText('IDL Program ID Mismatch')).toBeInTheDocument();
        expect(screen.getByText(/does not match the program being viewed/)).toBeInTheDocument();
        expect(screen.queryByText(/Anchor IDL/)).not.toBeInTheDocument();

        // Switch back to PMP tab - should render IDL normally
        fireEvent.click(screen.getByRole('button', { name: 'Program Metadata' }));

        expect(screen.queryByText('IDL Program ID Mismatch')).not.toBeInTheDocument();
        expect(screen.getByText('0.30.1 Program Metadata IDL')).toBeInTheDocument();
    });

    test('should not render IdlCard when both IDLs are null', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: null,
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: null,
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Anchor/)).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText(/Program Metadata IDL/)).not.toBeInTheDocument();
        });
    });
});
