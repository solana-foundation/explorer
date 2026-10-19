import { type AnchorIdl, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnchorProgramName } from '../anchor';

const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };

vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useProgramIdls: () => idlState,
}));

describe('AnchorProgramName', () => {
    it.each([
        [
            'an Anchor-standard PMP IDL before the Anchor IDL account',
            [
                { address: undefined, idl: namedIdl('pmp_program'), source: 'programMetadata', standard: 'Anchor' },
                { address: undefined, idl: namedIdl('anchor_program'), source: 'anchor', standard: 'Anchor' },
            ],
            'PmpProgram',
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
