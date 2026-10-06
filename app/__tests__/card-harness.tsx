import { TxInstructionSurface } from '@entities/instruction-card';
import { type InstructionParserDispatcher, InstructionParserProvider } from '@entities/instruction-parser';
import { render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

type ProviderOptions = {
    transactions?: boolean;
    dispatcher?: InstructionParserDispatcher;
    txSurface?: boolean;
};

/** Renders `ui` under the app providers; `rerender` keeps them. */
export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
    return render(ui, { wrapper: providers(options) });
}

/** Renders an instruction card on the transaction-page surface. */
export function renderTxCard(card: ReactElement) {
    return renderWithProviders(card, { txSurface: true });
}

function providers({ transactions = true, dispatcher, txSurface = false }: ProviderOptions) {
    return function Providers({ children }: { children: ReactNode }) {
        let tree = children;
        if (txSurface) tree = <TxInstructionSurface result={{ err: null }}>{tree}</TxInstructionSurface>;
        if (dispatcher) tree = <InstructionParserProvider dispatcher={dispatcher}>{tree}</InstructionParserProvider>;
        tree = <AccountsProvider>{tree}</AccountsProvider>;
        if (transactions) tree = <TransactionsProvider>{tree}</TransactionsProvider>;
        return (
            <ScrollAnchorProvider>
                <ClusterProvider>{tree}</ClusterProvider>
            </ScrollAnchorProvider>
        );
    };
}

export type CardRow = [label: string, value: string];

/** The first table's own rows in render order; rows of a nested table are left out. */
export function readCardRows(): CardRow[] {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .filter(row => row.closest('table') === card)
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? cells[1]?.textContent ?? ''];
        });
}

/** The cell's addresses, comma-joined. The text shows a truncated address; `data-address` holds all of it. */
export function readAddress(cell: HTMLElement | undefined): string | undefined {
    // eslint-disable-next-line testing-library/no-node-access -- an address has no role to query by
    const addresses = [...(cell?.querySelectorAll('[data-address]') ?? [])].map(el => el.getAttribute('data-address'));
    return addresses.length > 0 ? addresses.join(',') : undefined;
}

export function findCell(label: string): HTMLElement | undefined {
    const row = screen.getAllByRole('row').find(r => within(r).getAllByRole('cell')[0]?.textContent === label);
    return row && within(row).getAllByRole('cell')[1];
}

export function readCell(label: string): string {
    return findCell(label)?.textContent ?? '';
}
