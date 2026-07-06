import { gen } from '@__fixtures__/gen';
import type { SupportedIdl } from '@entities/idl';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { ProgramHeader } from '../ProgramHeader';

const mocks = vi.hoisted(() => ({
    programInfoById: {} as Record<string, { name: string; deployments: Cluster[] }>,
    useProgramIdls: vi.fn(),
    useSecurityTxt: vi.fn(),
}));

// ProgramHeader resolves its name from three sources; mock each so the priority is observable.
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({ useProgramIdls: mocks.useProgramIdls }));
vi.mock('@features/security-txt', () => ({ useSecurityTxt: mocks.useSecurityTxt }));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'https://example.com' }),
}));
// Partial mock: the @entities/idl barrel transitively pulls real exports from this module, so only
// override PROGRAM_INFO_BY_ID (via a getter so each test can swap the trusted-registry contents).
vi.mock('@utils/programs', async importOriginal => {
    const actual = await importOriginal<typeof import('@utils/programs')>();
    return {
        ...actual,
        get PROGRAM_INFO_BY_ID() {
            return mocks.programInfoById;
        },
    };
});
// Avoid the metadata-proxy image stack in a unit test.
vi.mock('@features/metadata', () => ({ ProxiedImage: () => null }));

const ADDRESS = 'EgJAPMy5V2j442dTGFRqT5ZtPCWtg6BEbEo2QzkExYyw';

function anchorIdlNamed(name: string): SupportedIdl {
    return {
        address: ADDRESS,
        instructions: [],
        metadata: { name, spec: '0.1.0', version: '0.1.0' },
    } as unknown as SupportedIdl;
}

function mockIdls(idl?: SupportedIdl): void {
    mocks.useProgramIdls.mockReturnValue({
        anchorIdl: idl,
        anchorIdlAddress: undefined,
        isLoading: false,
        programMetadataIdl: undefined,
        programMetadataIdlAddress: undefined,
    });
}

describe('ProgramHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.programInfoById = {};
        mocks.useSecurityTxt.mockReturnValue({ securityTxt: undefined });
        mockIdls();
    });

    test('should prefer the trusted-registry name over security.txt and IDL names', () => {
        mocks.programInfoById = { [ADDRESS]: { deployments: [Cluster.MainnetBeta], name: 'Trusted Program' } };
        mocks.useSecurityTxt.mockReturnValue({ securityTxt: gen.securityTxt({ name: 'SecTxt Name' }) });
        mockIdls(anchorIdlNamed('idl_program'));

        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('Trusted Program')).toBeInTheDocument();
        // Trusted name is not self-reported, so no warning.
        expect(screen.queryByLabelText('Self-reported program')).not.toBeInTheDocument();
    });

    test('should use the security.txt name (self-reported) when no trusted entry exists', () => {
        mocks.useSecurityTxt.mockReturnValue({ securityTxt: gen.securityTxt({ name: 'SecTxt Name' }) });
        mockIdls(anchorIdlNamed('idl_program'));

        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('SecTxt Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Self-reported program')).toBeInTheDocument();
    });

    test('should fall back to the IDL program name (title-cased, self-reported) when no trusted or security.txt name', () => {
        mockIdls(anchorIdlNamed('idl_program'));

        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('Idl Program')).toBeInTheDocument();
        expect(screen.getByLabelText('Self-reported program')).toBeInTheDocument();
    });

    test('should show the placeholder when no name source resolves', () => {
        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('Program Account')).toBeInTheDocument();
        expect(screen.queryByLabelText('Self-reported program')).not.toBeInTheDocument();
    });

    test('should fall through an empty security.txt name to the IDL program name', () => {
        // `||` (not `??`): an empty security.txt name must not win over the IDL name.
        mocks.useSecurityTxt.mockReturnValue({ securityTxt: gen.securityTxt({ name: '' }) });
        mockIdls(anchorIdlNamed('idl_program'));

        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('Idl Program')).toBeInTheDocument();
        expect(screen.getByLabelText('Self-reported program')).toBeInTheDocument();
    });

    test('should show the placeholder without a warning when a pmp security.txt has an empty name and no IDL name', () => {
        mocks.useSecurityTxt.mockReturnValue({ securityTxt: gen.securityTxt({ name: '', version: '1.2.3' }) });

        render(<ProgramHeader address={ADDRESS} />);

        expect(screen.getByText('Program Account')).toBeInTheDocument();
        // No self-reported name resolved, so no warning even though a pmp security.txt is present.
        expect(screen.queryByLabelText('Self-reported program')).not.toBeInTheDocument();
        // Version still surfaces from the pmp security.txt regardless of the name.
        expect(screen.getByText('1.2.3')).toBeInTheDocument();
    });
});
