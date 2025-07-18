import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import * as anchorModule from '@/app/providers/anchor';
import { ClusterProvider } from '@/app/providers/cluster';
import * as programMetadataIdlModule from '@/app/providers/useProgramMetadataIdl';

import { IdlCard } from '../IdlCard';

vi.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: (_query?: string) => false,
    toString: () => '',
});

const mockAnchorIdl = {
    metadata: {
        name: 'anchor_program',
        spec: '0.0.1',
        version: '0.1.0',
    },
};

const mockProgramMetadataIdl = {
    kind: 'rootNode',
    name: 'metadata_program',
    standard: 'codama',
    version: '1.2.11',
};

describe.only('IdlCard', () => {
    const programId = 'CmAwXVg7R7LVmKqVg9EyVHYF9U4VLVsXoP2RG7Zra6XY';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should render IdlCard with PMP IDL when programMetadataIdl exists', () => {
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

        // Check if IDL is rendered
        expect(screen.getByText('IDL')).toBeInTheDocument();
        expect(screen.getByText(/Codama IDL/)).toBeInTheDocument();
        expect(screen.getByText(/rootNode/)).toBeInTheDocument(); // from json view
        expect(screen.queryByText(/Anchor IDL/)).not.toBeInTheDocument();
        expect(screen.getAllByText('Download')).toHaveLength(1);
    });

    test('should render IdlCard with Anchor IDL when anchorIdl exists', () => {
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

        expect(screen.getByText('IDL')).toBeInTheDocument();
        expect(screen.getByText(/Anchor IDL/)).toBeInTheDocument();
        expect(screen.getByText(/metadata/)).toBeInTheDocument(); // from json view
        expect(screen.queryByText(/Codama IDL/)).not.toBeInTheDocument();
        expect(screen.getAllByText('Download')).toHaveLength(1);
    });

    test('should render IdlCard with both IDLs when both exist', () => {
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

        expect(screen.getByText('IDL')).toBeInTheDocument();
        expect(screen.getByText(/Codama IDL/)).toBeInTheDocument();
        expect(screen.getByText(/Anchor IDL/)).toBeInTheDocument();
        expect(screen.getAllByText('Download')).toHaveLength(2);
    });

    test('should not render IdlCard when both IDLs are null', () => {
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

        expect(screen.queryByText('IDL')).not.toBeInTheDocument();
        expect(screen.queryByText(/Codama IDL/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Anchor IDL/)).not.toBeInTheDocument();
    });
});