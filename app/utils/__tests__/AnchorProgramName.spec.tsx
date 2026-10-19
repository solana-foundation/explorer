import { type AnchorIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { AnchorProgramName } from '../anchor';

const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useProgramIdls: (...args: unknown[]) => useProgramIdls(...args),
}));

describe('AnchorProgramName', () => {
    beforeEach(() => useProgramIdls.mockClear());

    it('should read the IDLs of the program', () => {
        idlState.candidates = [];

        render(<AnchorProgramName programId={new PublicKey(anchorModernIdl.address)} url="http://localhost" />);

        expect(useProgramIdls).toHaveBeenCalledWith(anchorModernIdl.address, 'http://localhost', Cluster.MainnetBeta);
    });

    it.each([
        [
            'an Anchor-standard PMP IDL before the Anchor IDL account',
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
    ] satisfies [string, NonNullable<ProgramIdls['candidates']>, string][])(
        'should name the program with %s',
        (_, candidates, programName) => {
            idlState.candidates = candidates;

            render(<AnchorProgramName programId={new PublicKey(anchorModernIdl.address)} url="http://localhost" />);

            expect(screen.getByText(programName)).toBeInTheDocument();
        },
    );
});

function namedIdl(name: string): AnchorIdl {
    return { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name } } as unknown as AnchorIdl;
}
