import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorNoAddressIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics/track-event';

import {
    createIndexedDbCustomIdlStorage,
    customIdlStorage,
    type StorageReadResult,
} from '../../../api/custom-idl-storage';
import { customIdlStoreAtom, removeCustomIdlAtom, setIdlSelectionAtom, uploadCustomIdlAtom } from '../custom-idl-store';
import { type CustomIdlRecord } from '../types';

vi.mock('@/app/shared/lib/analytics/track-event', () => ({ trackEvent: vi.fn() }));

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const IDL_TEXT = JSON.stringify(anchorModernIdl);
const STORED = { idl: anchorModernIdl, origin: { kind: 'pasted' }, selected: 'custom' };

const unsubscribes: (() => void)[] = [];
const otherTab = createIndexedDbCustomIdlStorage();

describe('custom IDL store', () => {
    afterEach(() => {
        unsubscribes.splice(0).forEach(unsubscribe => unsubscribe());
        vi.restoreAllMocks();
        vi.doUnmock('../can-decoder-load');
    });

    it('should stay loading until the storage read resolves, then hold the stored records', async () => {
        await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
        const store = createStore();

        mount(store);

        expect(store.get(customIdlStoreAtom)).toEqual({ status: 'loading' });
        await vi.waitFor(() => expect(recordOf(store)?.selected).toBe('custom'));
    });

    it('should report unavailable storage', async () => {
        await putValue(PROGRAM_ADDRESS, '{}');
        vi.spyOn(indexedDB, 'open').mockImplementation(() => {
            throw new DOMException('blocked', 'SecurityError');
        });

        const store = await mountedStore();

        expect(store.get(customIdlStoreAtom)).toEqual({ status: 'unavailable' });
    });

    it('should list a stored value that does not parse and keep it in the storage', async () => {
        await putValue(PROGRAM_ADDRESS, '{not json');

        const store = await mountedStore();

        expect(store.get(customIdlStoreAtom)).toEqual({
            records: new Map(),
            status: 'ready',
            unreadable: [PROGRAM_ADDRESS],
        });
        expect(await storedValue(PROGRAM_ADDRESS)).toBe('{not json');
    });

    it('should remove a stored value that does not parse', async () => {
        await putValue('not-an-address', JSON.stringify(STORED));
        const store = await mountedStore();

        await store.set(removeCustomIdlAtom, 'not-an-address');

        expect(store.get(customIdlStoreAtom)).toEqual({ records: new Map(), status: 'ready', unreadable: [] });
        expect(await storedValue('not-an-address')).toBeUndefined();
    });

    it('should leave the loading state when the decoder check does not load', async () => {
        await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
        vi.resetModules();
        vi.doMock('../can-decoder-load', () => {
            throw new Error('ChunkLoadError');
        });
        const { customIdlStoreAtom: storeAtom } = await import('../custom-idl-store');
        const store = createStore();

        unsubscribes.push(store.sub(storeAtom, () => undefined));

        await vi.waitFor(() => expect(store.get(storeAtom)).toEqual({ status: 'failed' }));
        expect(await storedValue(PROGRAM_ADDRESS)).toBe(JSON.stringify(STORED));
    });

    it('should load in each of two stores mounted together', async () => {
        await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
        const first = createStore();
        const second = createStore();

        mount(first);
        mount(second);

        await vi.waitFor(() =>
            expect([recordOf(first)?.selected, recordOf(second)?.selected]).toEqual(['custom', 'custom']),
        );
    });

    describe('upload', () => {
        it('should store the IDL, select it and keep it across a reload', async () => {
            const store = await mountedStore();

            const result = await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));

            expect(result).toEqual({ ok: true, programAddress: PROGRAM_ADDRESS });
            expect(recordOf(store)).toMatchObject({
                origin: { fileName: 'idl.json', kind: 'file' },
                selected: 'custom',
            });
            expect(recordOf(await mountedStore())?.customIdl.idl).toEqual(anchorModernIdl);
        });

        it('should store the IDL under the address that the IDL declares when the caller passes none', async () => {
            const store = await mountedStore();

            const result = await store.set(uploadCustomIdlAtom, { ...upload(IDL_TEXT), programAddress: undefined });

            expect(result).toEqual({ ok: true, programAddress: PROGRAM_ADDRESS });
            expect(recordOf(store)?.customIdl.idl).toEqual(anchorModernIdl);
        });

        it.each([
            ['text that is not JSON', upload('{not json'), { kind: 'not-json' }],
            ['JSON that is not an IDL', upload('{"instructions":[]}'), { kind: 'cannot-load' }],
            [
                'a program address that is not base58',
                { ...upload(IDL_TEXT), programAddress: 'not-an-address' },
                { kind: 'invalid-address' },
            ],
            [
                'an IDL that declares an address that is not base58',
                {
                    ...upload(JSON.stringify({ ...anchorModernIdl, address: 'not-an-address' })),
                    programAddress: undefined,
                },
                { kind: 'invalid-declared-address' },
            ],
            [
                'an IDL without an address and no program address',
                { ...upload(JSON.stringify(anchorNoAddressIdl)), programAddress: undefined },
                { kind: 'missing-address' },
            ],
        ])('should reject %s and leave the store unchanged', async (_, input, error) => {
            const store = await mountedStore();

            expect(await store.set(uploadCustomIdlAtom, input)).toEqual({ error, ok: false });
            expect(store.get(customIdlStoreAtom)).toEqual({ records: new Map(), status: 'ready', unreadable: [] });
        });

        it('should reject an IDL for another program and name its address', async () => {
            const store = await mountedStore();

            const result = await store.set(uploadCustomIdlAtom, {
                ...upload(IDL_TEXT),
                programAddress: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq',
            });

            expect(result).toEqual({
                error: {
                    declaredAddress: PROGRAM_ADDRESS,
                    kind: 'program-mismatch',
                    programAddress: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq',
                },
                ok: false,
            });
        });

        it('should return quota-exceeded and leave the store unchanged when the storage is full', async () => {
            const store = await mountedStore();
            vi.spyOn(customIdlStorage, 'put').mockResolvedValue({ ok: false, reason: 'quota-exceeded' });

            expect(await store.set(uploadCustomIdlAtom, upload(IDL_TEXT))).toEqual({
                error: { kind: 'quota-exceeded' },
                ok: false,
            });
            expect(recordOf(store)).toBeUndefined();
        });
    });

    describe('selection', () => {
        it('should store the on-chain selection', async () => {
            const store = await mountedStore();
            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));

            expect(
                await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' }),
            ).toEqual({
                ok: true,
            });

            expect(recordOf(store)?.selected).toBe('onChain');
            expect(recordOf(await mountedStore())?.selected).toBe('onChain');
        });

        it('should keep an IDL that another tab saved after this tab loaded', async () => {
            const store = await mountedStore();
            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));
            const otherTabIdl = { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name: 'other_tab' } };
            await putValue(PROGRAM_ADDRESS, JSON.stringify({ ...STORED, idl: otherTabIdl }));

            await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' });

            expect(JSON.parse(String(await storedValue(PROGRAM_ADDRESS)))).toMatchObject({
                idl: otherTabIdl,
                selected: 'onChain',
            });
            expect(recordOf(store)?.customIdl.idl).toEqual(otherTabIdl);
        });

        it('should not overwrite an IDL that another tab saves during a selection change', async () => {
            const store = await mountedStore();
            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));
            const otherTabIdl = { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name: 'other_tab' } };
            const update = customIdlStorage.update.bind(customIdlStorage);
            let otherTabWrite: Promise<unknown> | undefined;
            vi.spyOn(customIdlStorage, 'update').mockImplementationOnce((programAddress, change) =>
                update(programAddress, value => {
                    otherTabWrite = otherTab.put({
                        programAddress: PROGRAM_ADDRESS,
                        value: JSON.stringify({ ...STORED, idl: otherTabIdl }),
                    });
                    return change(value);
                }),
            );

            await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' });
            await otherTabWrite;

            expect(JSON.parse(String(await storedValue(PROGRAM_ADDRESS))).idl).toEqual(otherTabIdl);
        });

        it('should not restore an IDL that another tab removed after this tab loaded', async () => {
            const store = await mountedStore();
            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));
            await customIdlStorage.remove(PROGRAM_ADDRESS);

            expect(
                await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' }),
            ).toEqual({
                ok: true,
            });

            expect(await storedValue(PROGRAM_ADDRESS)).toBeUndefined();
            expect(recordOf(store)).toBeUndefined();
        });
    });

    it('should remove the record and its selection', async () => {
        const store = await mountedStore();
        await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));
        await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' });

        await store.set(removeCustomIdlAtom, PROGRAM_ADDRESS);

        expect(recordOf(store)).toBeUndefined();
        expect(await storedValue(PROGRAM_ADDRESS)).toBeUndefined();
    });

    it('should reload when another tab changes a custom IDL', async () => {
        const store = await mountedStore();

        await otherTab.put({ programAddress: PROGRAM_ADDRESS, value: JSON.stringify(STORED) });

        await vi.waitFor(() => expect(recordOf(store)).toBeDefined());
    });

    it('should keep the result of the latest load when an earlier load resolves after it', async () => {
        const first = deferred<StorageReadResult>();
        const second = deferred<StorageReadResult>();
        vi.spyOn(customIdlStorage, 'list').mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        const store = createStore();
        mount(store);
        await otherTab.remove(PROGRAM_ADDRESS);

        second.resolve({ entries: [{ programAddress: PROGRAM_ADDRESS, value: JSON.stringify(STORED) }], ok: true });
        await vi.waitFor(() => expect(recordOf(store)).toBeDefined());
        first.resolve({ entries: [], ok: true });
        await first.promise;

        await new Promise(resolve => setTimeout(resolve, 0));
        expect(recordOf(store)).toBeDefined();
    });

    describe('analytics', () => {
        beforeEach(() => vi.mocked(trackEvent).mockClear());

        it('should track an added IDL with its standard and origin, and no text from the IDL or the file name', async () => {
            const store = await mountedStore();

            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));

            expect(vi.mocked(trackEvent).mock.calls).toEqual([
                ['cidl_added', { origin: 'file', program_id: PROGRAM_ADDRESS, standard: 'anchor' }],
            ]);
        });

        it('should track a second upload for the program as a replacement', async () => {
            const store = await mountedStore();
            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));

            await store.set(uploadCustomIdlAtom, { ...upload(IDL_TEXT), origin: { kind: 'pasted' } });

            expect(vi.mocked(trackEvent)).toHaveBeenLastCalledWith('cidl_replaced', {
                origin: 'pasted',
                program_id: PROGRAM_ADDRESS,
                standard: 'anchor',
            });
        });

        it.each([
            ['text that is not JSON', '{not json', 'not-json'],
            ['JSON that is not an IDL', '{"instructions":[]}', 'cannot-load'],
        ])('should track a failed upload of %s with its reason only', async (_, text, reason) => {
            const store = await mountedStore();

            await store.set(uploadCustomIdlAtom, upload(text));

            expect(vi.mocked(trackEvent).mock.calls).toEqual([['cidl_upload_failed', { reason }]]);
        });

        it('should track an upload that the browser refuses to store', async () => {
            const store = await mountedStore();
            vi.spyOn(customIdlStorage, 'put').mockResolvedValue({ ok: false, reason: 'quota-exceeded' });

            await store.set(uploadCustomIdlAtom, upload(IDL_TEXT));

            expect(vi.mocked(trackEvent).mock.calls).toEqual([['cidl_upload_failed', { reason: 'quota-exceeded' }]]);
        });

        it('should track a selection change', async () => {
            await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
            const store = await mountedStore();

            await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' });

            expect(vi.mocked(trackEvent).mock.calls).toEqual([
                ['cidl_selected', { program_id: PROGRAM_ADDRESS, selection: 'onChain' }],
            ]);
        });

        it('should not track a pick of the stored selection', async () => {
            await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
            const store = await mountedStore();

            await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'custom' });

            expect(trackEvent).not.toHaveBeenCalled();
        });

        it('should not track a selection change that the browser refuses to commit', async () => {
            const store = await mountedStore();
            vi.spyOn(customIdlStorage, 'update').mockImplementation(async (_, change) => {
                change(JSON.stringify(STORED));
                return { ok: false, reason: 'unavailable' };
            });

            await store.set(setIdlSelectionAtom, { programAddress: PROGRAM_ADDRESS, selected: 'onChain' });

            expect(trackEvent).not.toHaveBeenCalled();
        });

        it('should not track a removal that the browser refuses', async () => {
            await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
            const store = await mountedStore();
            vi.spyOn(customIdlStorage, 'remove').mockResolvedValue({ ok: false, reason: 'unavailable' });

            await store.set(removeCustomIdlAtom, PROGRAM_ADDRESS);

            expect(trackEvent).not.toHaveBeenCalled();
        });

        it('should track the removal of a custom IDL', async () => {
            await putValue(PROGRAM_ADDRESS, JSON.stringify(STORED));
            const store = await mountedStore();

            await store.set(removeCustomIdlAtom, PROGRAM_ADDRESS);

            expect(vi.mocked(trackEvent).mock.calls).toEqual([['cidl_removed', { program_id: PROGRAM_ADDRESS }]]);
        });

        it('should track the removal of a value under a key that is not a program address without the key', async () => {
            await putValue('my private note', JSON.stringify(STORED));
            const store = await mountedStore();

            await store.set(removeCustomIdlAtom, 'my private note');

            expect(vi.mocked(trackEvent)).toHaveBeenCalledWith('cidl_removed', expect.anything());
            expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain('my private note');
        });
    });
});

function putValue(programAddress: string, value: string) {
    return customIdlStorage.put({ programAddress, value });
}

async function storedValue(programAddress: string): Promise<unknown> {
    const read = await customIdlStorage.list();
    return read.ok ? read.entries.find(entry => entry.programAddress === programAddress)?.value : undefined;
}

function upload(text: string) {
    return { origin: { fileName: 'idl.json', kind: 'file' } as const, programAddress: PROGRAM_ADDRESS, text };
}

function mount(store: ReturnType<typeof createStore>) {
    unsubscribes.push(store.sub(customIdlStoreAtom, () => undefined));
}

async function mountedStore() {
    const store = createStore();
    mount(store);
    await vi.waitFor(() => expect(store.get(customIdlStoreAtom).status).not.toBe('loading'));
    return store;
}

function recordOf(store: ReturnType<typeof createStore>): CustomIdlRecord | undefined {
    const state = store.get(customIdlStoreAtom);
    return state.status === 'ready' ? state.records.get(PROGRAM_ADDRESS) : undefined;
}

function deferred<T>() {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}
