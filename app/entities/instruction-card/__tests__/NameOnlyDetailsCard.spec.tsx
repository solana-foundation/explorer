import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { toInstructionNode } from '../model/node';
import { InstructionSurfaceProvider } from '../model/surface';
import { NameOnlyDetailsCard } from '../ui/NameOnlyDetailsCard';

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta }) }));
vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));

const MANGO = new PublicKey(MANGO_PROGRAM_IDS.mainnet);

describe('NameOnlyDetailsCard', () => {
    it('should title the card with the registry program name and the instruction name', () => {
        renderCard({ name: 'Deposit' });

        expect(screen.getByText('Mango v3 (deprecated): Deposit')).toBeInTheDocument();
    });

    it('should title an unnamed instruction "Unknown"', () => {
        renderCard({});

        expect(screen.getByText('Mango v3 (deprecated): Unknown')).toBeInTheDocument();
    });

    it('should prefer an explicit program name over the registry name', () => {
        renderCard({ name: 'Swap', programName: 'Token Swap' });

        expect(screen.getByText('Token Swap: Swap')).toBeInTheDocument();
    });

    it('should open the card in raw mode', () => {
        renderCard({ name: 'Deposit' });

        expect(screen.getByRole('button', { name: 'Raw' })).toBeDisabled();
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });
});

function renderCard({ name, programName }: { name?: string; programName?: string }) {
    const ix = new TransactionInstruction({ data: Buffer.from([2, 0, 0, 0]), keys: [], programId: MANGO });

    return render(
        <InstructionSurfaceProvider
            surface={{
                Card: () => undefined,
                collapsible: false,
                instructionData: () => undefined,
                rawInstructions: undefined,
                result: { err: null },
                signature: undefined,
                validateProgram: false,
            }}
        >
            <NameOnlyDetailsCard node={toInstructionNode({ index: 0, ix })} name={name} programName={programName} />
        </InstructionSurfaceProvider>,
    );
}
