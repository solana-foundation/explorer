import type { Idl } from '@coral-xyz/anchor';
import * as anchorModule from '@entities/idl';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import * as programMetadataIdlModule from '@/app/entities/program-metadata';
import { ClusterProvider } from '@/app/providers/cluster';

import { IdlCard } from '../IdlCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock('@solana/kit', () => ({
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
    })),
}));

const mockAnchorIdl = {
    instructions: [],
    metadata: {
        name: 'anchor_program',
        spec: '0.1.0',
        version: '0.1.0',
    },
};

const mockProgramMetadataIdl = {
    kind: 'rootNode',
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

describe('IdlCard', () => {
    const programId = 'CmAwXVg7R7LVmKqVg9EyVHYF9U4VLVsXoP2RG7Zra6XY';

    beforeEach(() => {
        vi.clearAllMocks();

        (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
            get: () => 'mainnet-beta',
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
            programMetadataIdl: mockProgramMetadataIdl,
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
            idl: mockAnchorIdl as unknown as Idl,
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
            idl: mockAnchorIdl as unknown as Idl,
            program: null,
        });

        vi.spyOn(programMetadataIdlModule, 'useProgramMetadataIdl').mockReturnValue({
            programMetadataIdl: mockProgramMetadataIdl,
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
