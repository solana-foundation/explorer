import { type AnchorIdl, type CodamaIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import referenceIdl from '@entities/idl/mocks/anchor/reference-0.29.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { AnchorProgramName } from '../anchor';

const CODAMA_IDL = codamaIdl as unknown as CodamaIdl;
const UNBUILDABLE_IDL = referenceIdl as unknown as AnchorIdl;

const idlState: ProgramIdls = { idls: [] };
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@/app/entities/idl/model/use-program-idls', () => ({
    useProgramIdls: (...args: unknown[]) => useProgramIdls(...args),
}));

describe('AnchorProgramName', () => {
    beforeEach(() => useProgramIdls.mockClear());

    it('should read the IDLs of the program', () => {
        idlState.idls = [];

        render(<AnchorProgramName programId={new PublicKey(anchorModernIdl.address)} url="http://localhost" />);

        expect(useProgramIdls).toHaveBeenCalledWith(anchorModernIdl.address, 'http://localhost', Cluster.MainnetBeta);
    });

    it.each([
        [
            'an Anchor-standard PMP IDL over the Anchor IDL account',
            [
                {
                    idl: namedIdl('pmp_program'),
                    idlAddress: undefined,
                    source: IdlVariant.ProgramMetadata,
                    standard: 'Anchor',
                },
                {
                    idl: namedIdl('anchor_program'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'PmpProgram',
        ],
        [
            'the IDL from the Anchor IDL account when the PMP IDL is Codama',
            [
                { idl: CODAMA_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
                {
                    idl: namedIdl('anchor_program'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'AnchorProgram',
        ],
        [
            'the IDL from the Anchor IDL account when the PMP IDL does not build a program',
            [
                { idl: UNBUILDABLE_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' },
                {
                    idl: namedIdl('anchor_program'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'AnchorProgram',
        ],
        [
            'an Anchor IDL that declares no account types',
            [
                {
                    idl: { ...namedIdl('stateless_program'), accounts: [] },
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'StatelessProgram',
        ],
    ] satisfies [string, NonNullable<ProgramIdls['idls']>, string][])(
        'should name the program with %s',
        (_, idls, programName) => {
            idlState.idls = idls;

            render(<AnchorProgramName programId={new PublicKey(anchorModernIdl.address)} url="http://localhost" />);

            expect(screen.getByText(programName)).toBeInTheDocument();
        },
    );
});

function namedIdl(name: string): AnchorIdl {
    return { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name } } as unknown as AnchorIdl;
}
