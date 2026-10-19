import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { toInstructionNode } from '../model/node';
import { type InstructionShellProps, InstructionSurfaceProvider } from '../model/surface';
import { UnknownDetailsCard } from '../ui/UnknownDetailsCard';

const cluster = vi.hoisted(() => ({ current: undefined as Cluster | undefined }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: cluster.current }) }));

const MAINNET_ONLY_PROGRAM = new PublicKey('27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv');

describe('UnknownDetailsCard', () => {
    it('should title the card with the program name', () => {
        renderCard(SystemProgram.programId, Cluster.MainnetBeta);

        expect(screen.getByRole('heading')).toHaveTextContent('System Program: Unknown Instruction');
    });

    it('should name a program by address on a cluster it is not deployed to', () => {
        renderCard(MAINNET_ONLY_PROGRAM, Cluster.Devnet);

        expect(screen.getByRole('heading')).toHaveTextContent(
            `Unknown Program (${MAINNET_ONLY_PROGRAM.toBase58()}): Unknown Instruction`,
        );
    });

    it('should open the card in raw mode', () => {
        renderCard(SystemProgram.programId, Cluster.MainnetBeta);

        expect(screen.getByRole('checkbox', { name: 'Raw' })).toBeChecked();
    });

    it('should start in the decoded view, not the raw view, when the card has a body', () => {
        renderCard(SystemProgram.programId, Cluster.MainnetBeta, <p>Reason</p>);

        expect(screen.getByText('Reason')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Raw' })).not.toBeChecked();
    });
});

function renderCard(programId: PublicKey, onCluster: Cluster, body?: ReactNode) {
    cluster.current = onCluster;
    const ix = new TransactionInstruction({ data: Buffer.from([255]), keys: [], programId });

    return render(
        <InstructionSurfaceProvider surface={{ Shell, result: { err: null } }}>
            <UnknownDetailsCard node={toInstructionNode({ index: 0, ix })}>{body}</UnknownDetailsCard>
        </InstructionSurfaceProvider>,
    );
}

function Shell({ title, defaultRaw, children }: InstructionShellProps) {
    return (
        <section>
            <h2>{title}</h2>
            <input type="checkbox" aria-label="Raw" checked={Boolean(defaultRaw)} readOnly />
            {children}
        </section>
    );
}
