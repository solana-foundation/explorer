import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { toInstructionNode } from '../model/node';
import { type InstructionShellProps, InstructionSurfaceProvider } from '../model/surface';
import { NameOnlyDetailsCard } from '../ui/NameOnlyDetailsCard';

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta }) }));

const MANGO = new PublicKey(MANGO_PROGRAM_IDS.mainnet);

describe('NameOnlyDetailsCard', () => {
    it('should title the card with the registry program name and the instruction name', () => {
        renderCard({ name: 'Deposit' });

        expect(screen.getByRole('heading')).toHaveTextContent('Mango v3 (deprecated): Deposit');
    });

    it('should title an unnamed instruction "Unknown"', () => {
        renderCard({});

        expect(screen.getByRole('heading')).toHaveTextContent('Mango v3 (deprecated): Unknown');
    });

    it('should prefer an explicit program name over the registry name', () => {
        renderCard({ name: 'Swap', programName: 'Token Swap' });

        expect(screen.getByRole('heading')).toHaveTextContent('Token Swap: Swap');
    });

    it('should open the card in raw mode', () => {
        renderCard({ name: 'Deposit' });

        expect(screen.getByRole('checkbox', { name: 'Raw' })).toBeChecked();
    });
});

function renderCard({ name, programName }: { name?: string; programName?: string }) {
    const ix = new TransactionInstruction({ data: Buffer.from([2, 0, 0, 0]), keys: [], programId: MANGO });

    return render(
        <InstructionSurfaceProvider
            surface={{
                Card: () => undefined,
                Shell,
                instructionData: () => undefined,
                result: { err: null },
                signature: undefined,
            }}
        >
            <NameOnlyDetailsCard node={toInstructionNode({ index: 0, ix })} name={name} programName={programName} />
        </InstructionSurfaceProvider>,
    );
}

function Shell({ title, defaultRaw }: InstructionShellProps) {
    return (
        <section>
            <h2>{title}</h2>
            <input type="checkbox" aria-label="Raw" checked={Boolean(defaultRaw)} readOnly />
        </section>
    );
}
