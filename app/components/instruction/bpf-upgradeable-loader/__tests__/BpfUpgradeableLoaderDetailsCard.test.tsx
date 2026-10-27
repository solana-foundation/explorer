import { gen } from '@__fixtures__/gen';
import { inspectorSurface } from '@components/inspector/inspector-surface';
import { InstructionSurfaceProvider, toInstructionNode } from '@entities/instruction-card';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type CardRow, readCardRows, renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { Logger } from '@/app/shared/lib/logger';

import { BpfUpgradeableLoaderDetailsCard } from '../BpfUpgradeableLoaderDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const PROGRAM_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const PROGRAM_ROW: CardRow = ['Program', PROGRAM_ID.toBase58()];
const [ACCOUNT, AUTHORITY, NEW_AUTHORITY, PROGRAM_DATA] = Array.from({ length: 4 }, (_, n) =>
    gen.publicKey(n + 1).toBase58(),
);

describe('BpfUpgradeableLoaderDetailsCard', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { render: renderTxCard, surface: 'tx page' },
        { render: renderInspectorCard, surface: 'inspector' },
    ])('should render the Set Authority Checked rows on the $surface surface', ({ render }) => {
        render(card('setAuthorityChecked', { account: ACCOUNT, authority: AUTHORITY, newAuthority: NEW_AUTHORITY }));

        expect(screen.getByText('BPF Upgradeable Loader: Set Authority Checked')).toBeInTheDocument();
        expect(readCardRows()).toEqual([
            PROGRAM_ROW,
            ['Account', ACCOUNT],
            ['Authority', AUTHORITY],
            ['New Authority', NEW_AUTHORITY],
        ]);
    });

    it('should render the Set Authority rows', () => {
        renderTxCard(card('setAuthority', { account: ACCOUNT, authority: AUTHORITY, newAuthority: NEW_AUTHORITY }));

        expect(screen.getByText('BPF Upgradeable Loader: Set Authority')).toBeInTheDocument();
        expect(readCardRows()).toEqual([
            PROGRAM_ROW,
            ['Account', ACCOUNT],
            ['Authority', AUTHORITY],
            ['New Authority', NEW_AUTHORITY],
        ]);
    });

    it('should show the written bytes as Base 64 in lines of 50 characters', () => {
        const bytes = 'A'.repeat(60);
        renderTxCard(card('write', { account: ACCOUNT, authority: AUTHORITY, bytes, offset: 128 }));

        expect(readCardRows()).toEqual([
            PROGRAM_ROW,
            ['Account', ACCOUNT],
            ['Authority', AUTHORITY],
            ['Bytes (Base 64)', `${'A'.repeat(50)}\n${'A'.repeat(10)}`],
            ['Offset', '128'],
        ]);
    });

    it('should show (none) for a payer that Extend Program does not name', () => {
        renderTxCard(
            card('extendProgram', {
                additionalBytes: 1024,
                payerAccount: null,
                programAccount: ACCOUNT,
                programDataAccount: PROGRAM_DATA,
            }),
        );

        expect(readCardRows()).toEqual([
            PROGRAM_ROW,
            ['Additional Bytes', '1024'],
            ['Payer Account', '(none)'],
            ['Program Account', ACCOUNT],
            ['Program Data Account', PROGRAM_DATA],
        ]);
    });

    it('should show the unknown card for an instruction type it does not know', () => {
        renderTxCard(card('migrate', { account: ACCOUNT }));

        expect(screen.getByText('BPF Upgradeable Loader: Unknown Instruction')).toBeInTheDocument();
    });

    it('should log the error and show the unknown card for an instruction it cannot decode', () => {
        const logged = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);

        renderTxCard(card('upgrade', { authority: AUTHORITY }));

        expect(screen.getByText('BPF Upgradeable Loader: Unknown Instruction')).toBeInTheDocument();
        expect(logged).toHaveBeenCalled();
    });
});

function card(type: string, info: Record<string, unknown>) {
    const ix: ParsedInstruction = { parsed: { info, type }, program: 'bpf-upgradeable-loader', programId: PROGRAM_ID };
    return <BpfUpgradeableLoaderDetailsCard node={toInstructionNode({ index: 0, ix })} ix={ix} />;
}

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider surface={inspectorSurface(() => undefined)}>{ui}</InstructionSurfaceProvider>,
    );
}
