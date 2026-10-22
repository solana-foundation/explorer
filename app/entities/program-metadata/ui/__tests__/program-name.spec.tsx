import { DEFAULT_RPC_URL } from '@__fixtures__/gen';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { type AnchorIdl, type CodamaIdl, type ProgramIdls } from '@entities/idl';
import { IdlVariant } from '@entities/idl/@x/program-metadata';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacyIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import ProgramName from '../program-name';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

vi.mock('@entities/idl/@x/program-metadata', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl/@x/program-metadata')>()),
    useProgramIdls: mocks.useProgramIdls,
}));
vi.mock('@/app/utils/anchor', () => ({ AnchorProgramName: () => <span>Anchor program name</span> }));

const PROGRAM_ID = new PublicKey(codamaIdl.program.publicKey);
const CODAMA = codamaIdl as unknown as CodamaIdl;
const ANCHOR = anchorLegacyIdl as unknown as AnchorIdl;

describe('ProgramName', () => {
    beforeEach(() => mocks.useProgramIdls.mockReset());

    it('should read the IDLs with suspense', () => {
        mockIdls([]);

        renderName();

        expect(mocks.useProgramIdls).toHaveBeenCalledWith(PROGRAM_ID.toString(), DEFAULT_RPC_URL, Cluster.MainnetBeta, {
            suspense: true,
        });
    });

    it.each([
        ['the program has no IDL', []],
        [
            'the first IDL is from the Anchor IDL account',
            [{ idl: ANCHOR, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' }],
        ],
    ] satisfies [string, NonNullable<ProgramIdls['idls']>][])(
        'should show the Anchor program name when %s',
        (_, idls) => {
            mockIdls(idls);

            renderName();

            expect(screen.getByText('Anchor program name')).toBeInTheDocument();
        },
    );

    it('should name the program from the PMP Codama IDL', () => {
        mockIdls([{ idl: CODAMA, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' }]);

        renderName();

        expect(screen.getByText('ProgramMetadata')).toBeInTheDocument();
    });

    it('should name the program from the PMP IDL over the Anchor IDL account', () => {
        mockIdls([
            { idl: CODAMA, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
            { idl: ANCHOR, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
        ]);

        renderName();

        expect(screen.getByText('ProgramMetadata')).toBeInTheDocument();
    });

    it('should name the program from an Anchor-standard PMP IDL', () => {
        mockIdls([{ idl: ANCHOR, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' }]);

        renderName();

        expect(screen.getByText('AccountCompression')).toBeInTheDocument();
    });

    it('should show the Anchor program name for an Anchor-standard PMP IDL that Codama cannot convert', () => {
        const idl = anchorModernIdl as unknown as AnchorIdl;
        expect(() => rootNodeFromAnchor(idl as never)).toThrow();
        mockIdls([{ idl, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' }]);

        expect(() => renderName()).not.toThrow();
        expect(screen.getByText('Anchor program name')).toBeInTheDocument();
    });
});

function mockIdls(idls: ProgramIdls['idls']) {
    mocks.useProgramIdls.mockReturnValue({ idls });
}

function renderName() {
    return render(
        <ProgramName
            programId={PROGRAM_ID}
            url={DEFAULT_RPC_URL}
            cluster={Cluster.MainnetBeta}
            defaultName="Default name"
        />,
    );
}
