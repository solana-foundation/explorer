import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { type AnchorIdl, type CodamaIdl, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacyIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import ProgramName from '../program-name';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

vi.mock('@entities/idl/@x/program-metadata', () => ({ useProgramIdls: mocks.useProgramIdls }));
vi.mock('@/app/utils/anchor', () => ({ AnchorProgramName: () => <span>Anchor program name</span> }));

const PROGRAM_ID = new PublicKey(codamaIdl.program.publicKey);
const URL = 'https://api.mainnet-beta.solana.com';
const CODAMA = codamaIdl as unknown as CodamaIdl;
const ANCHOR = anchorLegacyIdl as unknown as AnchorIdl;

describe('ProgramName', () => {
    beforeEach(() => mocks.useProgramIdls.mockReset());

    it('should read the candidates with suspense', () => {
        mockCandidates([]);

        renderName();

        expect(mocks.useProgramIdls).toHaveBeenCalledWith(PROGRAM_ID.toString(), URL, Cluster.MainnetBeta, {
            suspense: true,
        });
    });

    it('should show the default name until the candidates are final', () => {
        mockCandidates(undefined);

        renderName();

        expect(screen.getByText('Default name')).toBeInTheDocument();
    });

    it.each([
        ['the program has no IDL', []],
        [
            'the first candidate is the Anchor IDL account',
            [{ address: undefined, idl: ANCHOR, source: 'anchor', standard: 'Anchor' }],
        ],
    ] satisfies [string, NonNullable<ProgramIdls['candidates']>][])(
        'should show the Anchor program name when %s',
        (_, candidates) => {
            mockCandidates(candidates);

            renderName();

            expect(screen.getByText('Anchor program name')).toBeInTheDocument();
        },
    );

    it.each([
        ['the PMP Codama IDL', { address: undefined, idl: CODAMA, source: 'programMetadata', standard: 'Codama' }],
        [
            'a selected custom Codama IDL',
            { idl: CODAMA, origin: { kind: 'pasted' }, source: 'custom', standard: 'Codama' },
        ],
    ] satisfies [string, NonNullable<ProgramIdls['candidates']>[number]][])(
        'should name the program from %s',
        (_, candidate) => {
            mockCandidates([candidate]);

            renderName();

            expect(screen.getByText('ProgramMetadata')).toBeInTheDocument();
        },
    );

    it('should name the program from an Anchor-standard PMP IDL', () => {
        mockCandidates([{ address: undefined, idl: ANCHOR, source: 'programMetadata', standard: 'Anchor' }]);

        renderName();

        expect(screen.getByText('AccountCompression')).toBeInTheDocument();
    });

    it('should show the Anchor program name for an Anchor-standard PMP IDL that Codama cannot convert', () => {
        const idl = anchorModernIdl as unknown as AnchorIdl;
        expect(() => rootNodeFromAnchor(idl as never)).toThrow();
        mockCandidates([{ address: undefined, idl, source: 'programMetadata', standard: 'Anchor' }]);

        expect(() => renderName()).not.toThrow();
        expect(screen.getByText('Anchor program name')).toBeInTheDocument();
    });

    it('should name the program from a selected custom Anchor IDL', () => {
        mockCandidates([{ idl: ANCHOR, origin: { kind: 'pasted' }, source: 'custom', standard: 'Anchor' }]);

        renderName();

        expect(screen.getByText('AccountCompression')).toBeInTheDocument();
    });

    it('should show the Anchor program name for a custom Anchor IDL that Codama cannot convert', () => {
        const idl = anchorModernIdl as unknown as AnchorIdl;
        expect(() => rootNodeFromAnchor(idl as never)).toThrow();
        mockCandidates([{ idl, origin: { kind: 'pasted' }, source: 'custom', standard: 'Anchor' }]);

        expect(() => renderName()).not.toThrow();
        expect(screen.getByText('Anchor program name')).toBeInTheDocument();
    });
});

function mockCandidates(candidates: ProgramIdls['candidates']) {
    mocks.useProgramIdls.mockReturnValue({ candidates });
}

function renderName() {
    return render(
        <ProgramName programId={PROGRAM_ID} url={URL} cluster={Cluster.MainnetBeta} defaultName="Default name" />,
    );
}
