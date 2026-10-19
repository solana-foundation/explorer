import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { render, waitFor } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { describe, expect, it } from 'vitest';

import { customIdlStorage } from '../../api/custom-idl-storage';
import { customIdlStoreAtom } from '../../model/custom-idl/custom-idl-store';
import { CustomIdlStorePreload } from '../CustomIdlStorePreload';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

describe('CustomIdlStorePreload', () => {
    it('should read the stored custom IDLs when it mounts', async () => {
        await customIdlStorage.put({
            programAddress: PROGRAM_ADDRESS,
            value: JSON.stringify({ idl: anchorModernIdl, origin: { kind: 'pasted' }, selected: 'custom' }),
        });
        const store = createStore();

        const { container } = render(
            <JotaiProvider store={store}>
                <CustomIdlStorePreload />
            </JotaiProvider>,
        );

        await waitFor(() => expect(store.get(customIdlStoreAtom)).toMatchObject({ status: 'ready' }));
        const state = store.get(customIdlStoreAtom);
        expect(state.status === 'ready' && state.records.has(PROGRAM_ADDRESS)).toBe(true);
        expect(container).toBeEmptyDOMElement();
    });
});
