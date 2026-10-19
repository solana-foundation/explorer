import { type Address, isAddress } from '@solana/kit';
import { atom, type Getter, type Setter } from 'jotai';

import { customIdlAnalytics } from '@/app/shared/lib/analytics';
import { Logger } from '@/app/shared/lib/logger';

import { customIdlStorage, type StorageWriteResult } from '../../api/custom-idl-storage';
import { type CustomIdlParseError, parseCustomIdl } from './parse-custom-idl';
import { parseStoredRecord, serializeRecord, withSelection } from './stored-record';
import { type CustomIdlOrigin, type CustomIdlRecord, type IdlSelection } from './types';

export type CustomIdlStore =
    | { status: 'loading' }
    | { status: 'ready'; records: ReadonlyMap<string, CustomIdlRecord>; unreadable: readonly string[] }
    | { status: 'unavailable' }
    | { status: 'failed' };

const storeStateAtom = atom<CustomIdlStore>({ status: 'loading' });
const loadGenerationAtom = atom(0);

/** Writing the atom reloads the store from the storage. */
export const customIdlStoreAtom = atom(
    get => get(storeStateAtom),
    (get, set) => reload(get, set),
);

customIdlStoreAtom.onMount = reloadStore => {
    void reloadStore();
    return customIdlStorage.subscribe(() => void reloadStore());
};

export type CustomIdlUploadError =
    { kind: 'not-json' } | CustomIdlParseError | { kind: Extract<StorageWriteResult, { ok: false }>['reason'] };

export const uploadCustomIdlAtom = atom(
    undefined,
    async (
        get,
        set,
        { programAddress, text, origin }: { programAddress: string | undefined; text: string; origin: CustomIdlOrigin },
    ): Promise<{ ok: true; programAddress: Address } | { ok: false; error: CustomIdlUploadError }> => {
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch {
            return uploadFailed({ kind: 'not-json' });
        }

        const parsed = await parseCustomIdl(json, programAddress);
        if (!parsed.ok) return uploadFailed(parsed.error);

        const { customIdl } = parsed;
        const store = get(storeStateAtom);
        const isReplacing = store.status === 'ready' && store.records.has(customIdl.programAddress);
        const value = serializeRecord({ customIdl, origin, selected: 'custom' });
        const written = await customIdlStorage.put({ programAddress: customIdl.programAddress, value });
        if (!written.ok) return uploadFailed({ kind: written.reason });
        await reload(get, set);
        const track = isReplacing ? customIdlAnalytics.trackReplaced : customIdlAnalytics.trackAdded;
        track(customIdl.programAddress, customIdl.standard, origin.kind);
        return { ok: true, programAddress: customIdl.programAddress };
    },
);

function uploadFailed(error: CustomIdlUploadError): { ok: false; error: CustomIdlUploadError } {
    customIdlAnalytics.trackUploadFailed(error.kind);
    return { error, ok: false };
}

type SelectionChange = { programAddress: string; selected: IdlSelection };

const selectionChangesAtom = atom<Promise<unknown>>(Promise.resolve());

// Changes run one after another, so each one reads the selection that the change before it stored.
export const setIdlSelectionAtom = atom(undefined, (get, set, change: SelectionChange): Promise<StorageWriteResult> => {
    const result = get(selectionChangesAtom).then(() => changeSelection(get, set, change));
    set(
        selectionChangesAtom,
        result.catch(() => undefined),
    );
    return result;
});

// The selection change reads and writes the stored record in one transaction to keep an IDL that another tab saved.
async function changeSelection(
    get: Getter,
    set: Setter,
    { programAddress, selected }: SelectionChange,
): Promise<StorageWriteResult> {
    let isChanged = false;
    const written = await customIdlStorage.update(programAddress, value => {
        const next = withSelection(value, selected);
        isChanged = next !== undefined;
        return next;
    });
    if (!written.ok) return written;
    if (isChanged) customIdlAnalytics.trackSelected(programAddress, selected);
    await reload(get, set);
    return { ok: true };
}

export const removeCustomIdlAtom = atom(undefined, async (get, set, programAddress: string) => {
    const result = await customIdlStorage.remove(programAddress);
    if (!result.ok) return result;
    customIdlAnalytics.trackRemoved(isAddress(programAddress) ? programAddress : undefined);
    await reload(get, set);
    return result;
});

async function reload(get: Getter, set: Setter): Promise<void> {
    const generation = get(loadGenerationAtom) + 1;
    set(loadGenerationAtom, generation);
    const store = await readStore().catch((error: unknown): CustomIdlStore => {
        Logger.error(new Error('[idl:custom-idl-store] Failed to read the custom IDLs', { cause: error }), {
            sentry: 'always',
        });
        return { status: 'failed' };
    });
    // A later reload read the storage later, so an earlier reload must not overwrite its result.
    if (get(loadGenerationAtom) === generation) set(storeStateAtom, store);
}

async function readStore(): Promise<CustomIdlStore> {
    const read = await customIdlStorage.list();
    if (!read.ok) return { status: 'unavailable' };

    const parsed = await Promise.all(read.entries.map(entry => parseStoredRecord(entry.programAddress, entry.value)));
    const records = new Map<string, CustomIdlRecord>();
    const unreadable: string[] = [];
    for (const entry of parsed) {
        if (entry.kind === 'check-failed') return { status: 'failed' };
        if (entry.kind === 'unreadable') unreadable.push(entry.programAddress);
        else records.set(entry.record.customIdl.programAddress, entry.record);
    }
    return { records, status: 'ready', unreadable };
}
