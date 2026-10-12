import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { DEFAULT_SIGNATURE, FEE_PAYER, MOCK_PARSED_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

const LG_WIDTH = 992;
const MOBILE_WIDTH = 375;

const mediaQueryListeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();
let viewportWidth = MOBILE_WIDTH;

describe('transaction::AccountsCard drawer', () => {
    beforeEach(() => mockViewport());

    afterEach(() => vi.restoreAllMocks());

    test('should open the tapped account', async () => {
        renderCard();

        await tapFeePayer();

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Account 1');
        expect(dialog).toHaveTextContent(FEE_PAYER.toBase58());
    });

    test('should close on Close', async () => {
        renderCard();
        await tapFeePayer();
        await screen.findByRole('dialog');

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    test('should open again after a close', async () => {
        renderCard();
        await tapFeePayer();
        await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        await tapFeePayer();

        expect(await screen.findByRole('dialog')).toHaveTextContent('Account 1');
    });

    test('should stay closed after the viewport widens and narrows again', async () => {
        renderCard();
        await tapFeePayer();
        await screen.findByRole('dialog');

        resizeTo(LG_WIDTH);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        resizeTo(MOBILE_WIDTH);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

function renderCard() {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
    );
    return render(
        <Wrapper>
            <AccountsCard signature={DEFAULT_SIGNATURE} />
        </Wrapper>,
    );
}

async function tapFeePayer() {
    await userEvent.click(screen.getAllByText(FEE_PAYER.toBase58())[0]);
}

function mockViewport() {
    mediaQueryListeners.clear();
    viewportWidth = MOBILE_WIDTH;
    vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => {
        const listeners = mediaQueryListeners.get(query) ?? new Set<(event: MediaQueryListEvent) => void>();
        mediaQueryListeners.set(query, listeners);
        return {
            addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
                listeners.add(listener),
            addListener: vi.fn(),
            dispatchEvent: vi.fn(),
            get matches() {
                return matchesQuery(query);
            },
            media: query,
            onchange: null,
            removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
                listeners.delete(listener),
            removeListener: vi.fn(),
        } as unknown as MediaQueryList;
    });
}

function resizeTo(width: number) {
    act(() => {
        viewportWidth = width;
        for (const [query, listeners] of mediaQueryListeners) {
            const event = { matches: matchesQuery(query) } as MediaQueryListEvent;
            for (const listener of listeners) listener(event);
        }
    });
}

function matchesQuery(query: string) {
    // eslint-disable-next-line no-restricted-syntax -- need regex to parse CSS media query string from matchMedia
    const minWidth = query.match(/\(min-width:\s*(\d+)px\)/);
    return minWidth ? viewportWidth >= parseInt(minWidth[1], 10) : false;
}
