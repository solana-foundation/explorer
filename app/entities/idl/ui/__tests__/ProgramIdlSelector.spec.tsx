import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { customIdlStorage } from '../../api/custom-idl-storage';
import { customIdlStoreAtom } from '../../model/custom-idl/custom-idl-store';
import { CUSTOM_IDL_SAVE_FAILED_MESSAGE } from '../custom-idl-messages';
import { ProgramIdlSelector } from '../ProgramIdlSelector';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toast: vi.fn() }));
vi.stubGlobal('fetch', mocks.fetch);
vi.mock('@components/shared/ui/sonner/use-toast', () => ({ useToast: () => ({ custom: mocks.toast }) }));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'https://api.mainnet-beta.solana.com' }),
}));

describe('ProgramIdlSelector', () => {
    beforeEach(() => {
        mocks.toast.mockClear();
        mocks.fetch.mockResolvedValue({
            json: async () => ({ idls: { anchor: { name: 'anchor_idl' }, programMetadata: { name: 'pmp_idl' } } }),
            ok: true,
        });
    });

    afterEach(() => vi.restoreAllMocks());

    it('should render nothing when the program has no custom IDL', async () => {
        const { container, store } = renderSelector();

        await storeIsReady(store);
        expect(container).toBeEmptyDOMElement();
    });

    it('should show the on-chain selection, not None, while the on-chain IDLs load', async () => {
        await storeCustomIdl('onChain');
        let respond: (response: unknown) => void = () => undefined;
        mocks.fetch.mockReturnValue(new Promise(resolve => (respond = resolve)));
        const { store } = renderSelector();

        await storeIsReady(store);
        expect(screen.getByRole('button', { name: 'IDL: On-chain' })).toBeInTheDocument();

        respond({ json: async () => ({ idls: { programMetadata: { name: 'pmp_idl' } } }), ok: true });

        expect(await screen.findByRole('button', { name: 'IDL: PMP' })).toBeInTheDocument();
    });

    it('should list the custom IDL and the on-chain IDL that the program decodes with', async () => {
        await storeCustomIdl();
        renderSelector();

        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));

        const sources = screen.getAllByRole('menuitemradio').map(item => item.textContent);
        expect(sources).toEqual(['CustomPasted JSON', 'On-chainPMP']);
    });

    it('should store the on-chain selection', async () => {
        await storeCustomIdl();
        renderSelector();

        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        await userEvent.click(screen.getByRole('menuitemradio', { name: 'On-chain PMP' }));

        expect(await screen.findByRole('button', { name: 'IDL: PMP' })).toBeInTheDocument();
        expect(JSON.parse(String(await storedValue())).selected).toBe('onChain');
    });

    // The store reads the storage again after a selection change, so the second read means the change has ended.
    it('should not write the selection again when the user picks the stored one', async () => {
        await storeCustomIdl();
        renderSelector();
        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        const list = vi.spyOn(customIdlStorage, 'list');
        const put = vi.spyOn(customIdlStorage, 'put');

        await userEvent.click(screen.getByRole('menuitemradio', { name: 'Custom Pasted JSON' }));

        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
        expect(put).not.toHaveBeenCalled();
    });

    it('should store the last pick when the user picks again before the first change is stored', async () => {
        await storeCustomIdl();
        renderSelector();
        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        const list = vi.spyOn(customIdlStorage, 'list');
        const put = customIdlStorage.put.bind(customIdlStorage);
        let storeFirstPick: () => void = () => undefined;
        vi.spyOn(customIdlStorage, 'put').mockImplementationOnce(
            entry => new Promise(resolve => (storeFirstPick = () => resolve(put(entry)))),
        );

        await userEvent.click(screen.getByRole('menuitemradio', { name: 'On-chain PMP' }));
        await userEvent.click(screen.getByRole('button', { name: 'IDL: Custom' }));
        await userEvent.click(screen.getByRole('menuitemradio', { name: 'Custom Pasted JSON' }));
        storeFirstPick();

        // Each change reads the storage before it writes and again when it reloads.
        await waitFor(() => expect(list).toHaveBeenCalledTimes(4));
        expect(JSON.parse(String(await storedValue())).selected).toBe('custom');
        expect(await screen.findByRole('button', { name: 'IDL: Custom' })).toBeInTheDocument();
    });

    it('should report a failure when the browser refuses the selection change', async () => {
        await storeCustomIdl();
        renderSelector();
        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        vi.spyOn(customIdlStorage, 'put').mockResolvedValue({ ok: false, reason: 'unavailable' });

        await userEvent.click(screen.getByRole('menuitemradio', { name: 'On-chain PMP' }));

        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' }),
        );
    });

    it('should report a failure when the browser cannot read the stored record for a selection change', async () => {
        await storeCustomIdl();
        renderSelector();
        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        vi.spyOn(customIdlStorage, 'list').mockResolvedValueOnce({ ok: false, reason: 'unavailable' });

        await userEvent.click(screen.getByRole('menuitemradio', { name: 'On-chain PMP' }));

        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' }),
        );
    });

    it('should remove the custom IDL', async () => {
        await storeCustomIdl();
        renderSelector();

        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Remove custom IDL' }));

        await waitFor(() => expect(screen.queryByRole('button', { name: 'IDL: Custom' })).not.toBeInTheDocument());
        expect(await storedValue()).toBeUndefined();
    });

    it('should report a failure when the browser refuses the removal', async () => {
        await storeCustomIdl();
        renderSelector();
        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        vi.spyOn(customIdlStorage, 'remove').mockResolvedValue({ ok: false, reason: 'unavailable' });

        await userEvent.click(screen.getByRole('menuitem', { name: 'Remove custom IDL' }));

        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' }),
        );
        expect(screen.getByRole('button', { name: 'IDL: Custom' })).toBeInTheDocument();
    });

    it('should open the upload dialog to replace the custom IDL', async () => {
        await storeCustomIdl();
        renderSelector();

        await userEvent.click(await screen.findByRole('button', { name: 'IDL: Custom' }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Replace custom IDL…' }));

        expect(await screen.findByRole('dialog', { name: 'Replace the custom IDL' })).toBeInTheDocument();
    });
});

function renderSelector() {
    const store = createStore();
    const view = render(
        <JotaiProvider store={store}>
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
                <ProgramIdlSelector programAddress={PROGRAM_ADDRESS} />
            </SWRConfig>
        </JotaiProvider>,
    );
    return { ...view, store };
}

function storeCustomIdl(selected = 'custom') {
    return customIdlStorage.put({
        programAddress: PROGRAM_ADDRESS,
        value: JSON.stringify({ idl: anchorModernIdl, origin: { kind: 'pasted' }, selected }),
    });
}

async function storedValue(): Promise<unknown> {
    const read = await customIdlStorage.list();
    return read.ok ? read.entries.find(entry => entry.programAddress === PROGRAM_ADDRESS)?.value : undefined;
}

// The selector renders nothing while the store loads, so an empty render proves nothing before the store is ready.
async function storeIsReady(store: ReturnType<typeof createStore>) {
    await waitFor(() => expect(store.get(customIdlStoreAtom)).toMatchObject({ status: 'ready' }));
    await act(async () => undefined);
}
