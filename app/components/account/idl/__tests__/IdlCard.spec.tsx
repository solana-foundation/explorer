import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import * as programMetadataIdlModule from '@/app/entities/program-metadata';
import * as anchorModule from '@/app/providers/anchor';
import { ClusterProvider } from '@/app/providers/cluster';

import { IdlCard } from '../IdlCard';

vi.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: (_query?: string) => false,
    toString: () => '',
});

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
    });

    // TODO(hoodies): improve test-case
    test.skip('should render IdlCard with PMP IDL when programMetadataIdl exists', async () => {
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
        expect(screen.getByText(/rootNode/)).toBeInTheDocument(); // from json view
        expect(screen.queryByText(/Anchor IDL/)).not.toBeInTheDocument();
    });

    test.skip('should render IdlCard with Anchor IDL when anchorIdl exists', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: mockAnchorIdl as any,
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
        expect(screen.getByText(/metadata/)).toBeInTheDocument(); // from json view
        expect(screen.queryByText(/Program Metadata IDL/)).not.toBeInTheDocument();
    });

    test.skip('should render IdlCard tabs when both IDLs exist', async () => {
        vi.spyOn(anchorModule, 'useAnchorProgram').mockReturnValue({
            idl: mockAnchorIdl as any,
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

        // pmp idl should be rendered as first
        await waitFor(() => {
            expect(screen.getByText(/Program Metadata IDL/)).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: 'Anchor' });
        fireEvent.click(button);
        expect(screen.getByText(/Anchor IDL/)).toBeInTheDocument();
    });

    test.skip('should not render IdlCard when both IDLs are null', async () => {
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

        expect(screen.queryByText(/Anchor/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Program Metadata IDL/)).not.toBeInTheDocument();
    });
});
