import { gen } from '@__fixtures__/gen';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { BPF_LOADER_PROGRAM_ID, type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { readCardRows, renderTxCard } from '@/app/__tests__/card-harness';
import { Logger } from '@/app/shared/lib/logger';

import { bpfLoaderInstructionParser } from '../../lib/bpf-loader-client';
import { BpfLoaderDetailsCard } from '../BpfLoaderDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([bpfLoaderInstructionParser]);

const ACCOUNT = gen.address(1);
const PROGRAM = BPF_LOADER_PROGRAM_ID.toBase58();

const BYTES = 'AgAAAA==';

describe('BpfLoaderDetailsCard', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should render the rows of a write', async () => {
        renderCard(dispatch('write', { account: ACCOUNT, bytes: BYTES, offset: 1024 }));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                ['Program', PROGRAM],
                ['Account', ACCOUNT],
                ['Bytes (Base 64)', BYTES],
                ['Offset', '1024'],
            ]);
        });

        expect(screen.getByText('BPF Loader 2: Write')).toBeInTheDocument();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A write carries a chunk of the program, so its base64 runs well past one line.
    it('should break write bytes longer than a line', async () => {
        const bytes = 'A'.repeat(60);

        renderCard(dispatch('write', { account: ACCOUNT, bytes, offset: 0 }));

        await waitFor(() => {
            expect(readCardRows()[2]).toEqual(['Bytes (Base 64)', ['A'.repeat(50), 'A'.repeat(10)].join('\n')]);
        });
    });

    it('should render the rows of a finalize', async () => {
        renderCard(dispatch('finalize', { account: ACCOUNT }));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                ['Program', PROGRAM],
                ['Account', ACCOUNT],
            ]);
        });

        expect(screen.getByText('BPF Loader 2: Finalize')).toBeInTheDocument();
    });

    it('should fall back for an instruction type it does not decode', async () => {
        renderCard(dispatch('initializeBuffer', { account: ACCOUNT }));

        await waitFor(() => {
            expect(screen.getByText('BPF Loader 2: Unknown Instruction')).toBeInTheDocument();
        });
    });

    // The schemas are what stop a renamed or missing field reaching the rows uncoerced.
    it('should fall back and report a payload its schema rejects', async () => {
        renderCard(dispatch('write', { account: ACCOUNT, offset: 'not a number' }));

        await waitFor(() => {
            expect(screen.getByText('BPF Loader 2: Unknown Instruction')).toBeInTheDocument();
        });
        expect(Logger.error).toHaveBeenCalled();
    });

    // A foreign program id proves the row reads the node rather than a BPF-loader constant.
    it('should render the program row from the node', async () => {
        const loaderV1 = new PublicKey('BPFLoader1111111111111111111111111111111111');
        const ix = dispatch('finalize', { account: ACCOUNT });

        renderCard({ ...ix, programId: loaderV1 });

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', loaderV1.toBase58()]);
        });
    });
});

/** An RPC-parsed instruction, run through the dispatcher the way the tx page does. */
function dispatch(type: string, info: Record<string, unknown>): ParsedInstruction {
    return dispatcher.fromParsedInstruction({
        parsed: { info, type },
        program: 'bpf-loader',
        programId: BPF_LOADER_PROGRAM_ID,
    });
}

function renderCard(ix: ParsedInstruction) {
    return renderTxCard(<BpfLoaderDetailsCard ix={ix} index={0} />);
}
