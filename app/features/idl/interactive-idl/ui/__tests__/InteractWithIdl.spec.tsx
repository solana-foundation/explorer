import { type IdlSource, type InstructionData } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { originalIdlAtom, programIdAtom } from '../../model/state-atoms';
import { type BaseIdl } from '../../model/unified-program';
import { InteractWithIdl } from '../InteractWithIdl';

vi.mock('@/app/providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta }) }));
vi.mock('@/app/providers/wallet/use-wallet', () => ({
    useWallet: () => ({ canSign: true, connected: true, publicKey: PublicKey.default, walletName: 'Test' }),
}));
vi.mock('@components/shared/ui/sonner/use-toast', () => ({ useToast: () => ({ custom: vi.fn() }) }));
vi.mock('../../model/use-instruction', () => ({
    isEnabled: () => true,
    useInstruction: () => ({ executeInstruction: vi.fn(), simulateInstruction: vi.fn(), status: 'idle' }),
}));
vi.mock('../InteractWithIdlView', () => ({
    InteractWithIdlView: ({
        onExecuteInstruction,
    }: {
        onExecuteInstruction: (data: InstructionData, params: unknown, options: unknown) => Promise<void>;
    }) => (
        <button
            type="button"
            onClick={() => void onExecuteInstruction({ name: 'initialize' } as InstructionData, {}, {})}
        >
            Send
        </button>
    ),
}));

describe('InteractWithIdl', () => {
    it.each([
        ['custom', 1],
        ['anchor', 0],
    ] satisfies [IdlSource, number][])(
        'should say in the mainnet confirmation whether the transaction uses the custom IDL (source: %s)',
        async (source, count) => {
            const store = createStore();
            store.set(originalIdlAtom, { idl: anchorModernIdl as unknown as BaseIdl, source });
            store.set(programIdAtom, new PublicKey(anchorModernIdl.address));
            render(
                <JotaiProvider store={store}>
                    <InteractWithIdl />
                </JotaiProvider>,
            );

            await userEvent.click(screen.getByRole('button', { name: 'Send' }));

            expect(await screen.findByRole('dialog')).toBeInTheDocument();
            expect(screen.queryAllByText('uses your custom IDL', { exact: false })).toHaveLength(count);
        },
    );
});
