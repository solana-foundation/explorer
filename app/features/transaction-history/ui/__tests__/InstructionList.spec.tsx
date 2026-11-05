import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InstructionList, ProgramsBlock } from '../InstructionList';

describe('InstructionList', () => {
    it('should render the full list', () => {
        const instructions = [
            { name: 'Transfer', programName: 'System' },
            { name: 'Mint To', programName: 'Token' },
            { name: 'Burn', programName: 'Token' },
            { name: 'Transfer Checked', programName: 'Token' },
            { name: 'Set Compute Unit Limit', programName: 'Compute Budget' },
        ];
        render(<InstructionList instructions={instructions} />);

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        expect(screen.getByText('Mint To')).toBeInTheDocument();
        expect(screen.getByText('Burn')).toBeInTheDocument();
        expect(screen.getByText('Transfer Checked')).toBeInTheDocument();
        expect(screen.getByText('Set Compute Unit Limit')).toBeInTheDocument();
    });

    it('should collapse repeated instructions into a single counted row', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', programName: 'Token Program' },
                    { name: 'Transfer', programName: 'Token Program' },
                    { name: 'Transfer', programName: 'Token Program' },
                ]}
            />,
        );

        expect(screen.getAllByText('Transfer')).toHaveLength(1);
        expect(screen.getByText('3 ×')).toBeInTheDocument();
    });

    it('should show the count on a repeated row and no count on a single row', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', programName: 'Token Program' },
                    { name: 'Transfer', programName: 'Token Program' },
                    { name: 'Mint To', programName: 'Token Program' },
                ]}
            />,
        );

        expect(screen.getByText('2 ×')).toBeInTheDocument();
        expect(screen.queryByText('1 ×')).not.toBeInTheDocument();
    });
});

describe('ProgramsBlock', () => {
    it('should call retry when the failed fetch is retried', () => {
        const retry = vi.fn();
        render(<ProgramsBlock state={{ retry, status: 'failed' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'Retry loading programs' }));

        expect(retry).toHaveBeenCalledOnce();
    });

    it('should list the instructions of a loaded row', () => {
        const summaries = [{ name: 'Swap', programName: 'Raydium CLMM' }];
        render(<ProgramsBlock state={{ messageBytes: new Uint8Array(0), status: 'loaded', summaries }} />);

        expect(screen.getByText('Swap')).toBeInTheDocument();
        expect(screen.queryByText('---')).not.toBeInTheDocument();
    });

    it('should show no retry while loading', () => {
        render(<ProgramsBlock state={{ status: 'loading' }} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should show a dash for a transaction with no instructions to list', () => {
        render(<ProgramsBlock state={{ messageBytes: new Uint8Array(0), status: 'loaded', summaries: [] }} />);

        expect(screen.getByText('---')).toBeInTheDocument();
    });
});
