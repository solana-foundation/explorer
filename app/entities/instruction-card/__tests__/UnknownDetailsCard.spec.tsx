import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { toInstructionNode } from '../model/node';
import { InstructionSurfaceProvider } from '../model/surface';
import { UnknownDetailsCard } from '../ui/UnknownDetailsCard';

const cluster = vi.hoisted(() => ({ current: undefined as Cluster | undefined }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: cluster.current }) }));
vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));

const MAINNET_ONLY_PROGRAM = new PublicKey('27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv');

describe('UnknownDetailsCard', () => {
    it('should title the card with the program name', () => {
        renderCard(SystemProgram.programId, Cluster.MainnetBeta);

        expect(screen.getByText('System Program: Unknown Instruction')).toBeInTheDocument();
    });

    it('should name a program by address on a cluster it is not deployed to', () => {
        renderCard(MAINNET_ONLY_PROGRAM, Cluster.Devnet);

        expect(
            screen.getByText(`Unknown Program (${MAINNET_ONLY_PROGRAM.toBase58()}): Unknown Instruction`),
        ).toBeInTheDocument();
    });

    it('should open the card in raw mode', () => {
        renderCard(SystemProgram.programId, Cluster.MainnetBeta);

        expect(screen.getByRole('button', { name: 'Raw' })).toBeDisabled();
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });
});

function renderCard(programId: PublicKey, onCluster: Cluster) {
    cluster.current = onCluster;
    const ix = new TransactionInstruction({ data: Buffer.from([255]), keys: [], programId });

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
            <UnknownDetailsCard node={toInstructionNode({ index: 0, ix })} />
        </InstructionSurfaceProvider>,
    );
}
