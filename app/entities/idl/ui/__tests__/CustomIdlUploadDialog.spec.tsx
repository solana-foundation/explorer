import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { customIdlStorage, type StorageWriteResult } from '../../api/custom-idl-storage';
import { customIdlStoreAtom } from '../../model/custom-idl/custom-idl-store';
import { CustomIdlUploadDialog } from '../CustomIdlUploadDialog';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const OTHER_ADDRESS = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';
const IDL_TEXT = JSON.stringify(anchorModernIdl);

describe('CustomIdlUploadDialog', () => {
    afterEach(() => vi.restoreAllMocks());

    it.each([
        ['text that is not JSON', '{not json', 'This text is not valid JSON.'],
        ['JSON that is not an IDL', '{"instructions":[]}', 'This JSON is not an Anchor or Codama IDL.'],
        [
            'an IDL the decoder cannot load',
            JSON.stringify({
                ...anchorModernIdl,
                instructions: [{ ...anchorModernIdl.instructions[0], args: [{ name: 'a', type: 'u999' }] }],
            }),
            'The Explorer cannot decode instructions with this IDL.',
        ],
    ])('should show an error for %s and stay open', async (_, text, message) => {
        const { onOpenChange } = renderDialog(PROGRAM_ADDRESS);

        submitPasted(text);

        expect(await screen.findByRole('alert')).toHaveTextContent(message);
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should name both addresses for an IDL of another program', async () => {
        renderDialog(OTHER_ADDRESS);

        submitPasted(IDL_TEXT);

        expect(await screen.findByRole('alert')).toHaveTextContent(
            `This IDL is for program ${PROGRAM_ADDRESS}, not ${OTHER_ADDRESS}.`,
        );
    });

    it('should name the address that the IDL declares when that address is not base58', async () => {
        renderDialog(PROGRAM_ADDRESS);

        submitPasted(JSON.stringify({ ...anchorModernIdl, address: 'not-an-address' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'The program address that this IDL declares is not a valid Solana address.',
        );
    });

    it.each([
        ['quota-exceeded', 'This IDL does not fit in the browser storage.'],
        ['unavailable', 'This browser blocks storage for the Explorer'],
    ] as const)('should explain a write that fails as %s', async (reason, message) => {
        vi.spyOn(customIdlStorage, 'put').mockResolvedValue({ ok: false, reason });
        renderDialog(PROGRAM_ADDRESS);

        submitPasted(IDL_TEXT);

        expect(await screen.findByRole('alert')).toHaveTextContent(message);
        expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
    });

    it('should disable Add and Cancel until the IDL is saved', async () => {
        let finishPut: (result: StorageWriteResult) => void = () => undefined;
        vi.spyOn(customIdlStorage, 'put').mockReturnValue(new Promise(resolve => (finishPut = resolve)));
        const { onOpenChange } = renderDialog(PROGRAM_ADDRESS);

        submitPasted(IDL_TEXT);

        await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled());
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await act(async () => finishPut({ ok: true }));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('should stay open on Escape until the IDL is saved, and show a failed write', async () => {
        let finishPut: (result: StorageWriteResult) => void = () => undefined;
        vi.spyOn(customIdlStorage, 'put').mockReturnValue(new Promise(resolve => (finishPut = resolve)));
        const { onOpenChange } = renderDialog(PROGRAM_ADDRESS);

        submitPasted(IDL_TEXT);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled());
        await userEvent.keyboard('{Escape}');
        await act(async () => finishPut({ ok: false, reason: 'quota-exceeded' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('This IDL does not fit in the browser storage.');
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should enable Add again when the upload throws', async () => {
        const depth = 100_000;
        const deepIdl = JSON.stringify({ ...codamaIdl, x: '' }).replace(
            '"x":""',
            `"x":${'['.repeat(depth)}${']'.repeat(depth)}`,
        );
        renderDialog(codamaIdl.program.publicKey);

        submitPasted(deepIdl);

        expect(await screen.findByRole('alert')).toHaveTextContent('The browser did not save the change');
        expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    });

    it('should ask the user to try again when the decoder check does not load', async () => {
        vi.resetModules();
        vi.doMock('@/app/entities/idl/model/custom-idl/can-decoder-load', () => {
            throw new Error('ChunkLoadError');
        });
        try {
            const { CustomIdlUploadDialog: DialogWithoutDecoders } = await import('../CustomIdlUploadDialog');
            render(
                <JotaiProvider store={createStore()}>
                    <DialogWithoutDecoders
                        programAddress={PROGRAM_ADDRESS}
                        isReplacing={false}
                        open
                        onOpenChange={vi.fn()}
                    />
                </JotaiProvider>,
            );

            submitPasted(IDL_TEXT);

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'The Explorer could not check this IDL. Try again.',
            );
        } finally {
            vi.doUnmock('@/app/entities/idl/model/custom-idl/can-decoder-load');
        }
    });

    it('should not submit without IDL text', async () => {
        const { onOpenChange, store } = renderDialog(PROGRAM_ADDRESS);

        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(recordOf(store)).toBeUndefined();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should store pasted JSON and close', async () => {
        const { onOpenChange, store } = renderDialog(PROGRAM_ADDRESS);

        submitPasted(IDL_TEXT);

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(recordOf(store)?.origin).toEqual({ kind: 'pasted' });
    });

    it('should store pasted JSON without a network request', async () => {
        Object.values(Logger).forEach(method => vi.mocked(method).mockClear());
        const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        const send = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => undefined);
        const { onOpenChange } = renderDialog(PROGRAM_ADDRESS);

        submitPasted(IDL_TEXT);

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(fetch).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
        const logged = Object.values(Logger).flatMap(method => vi.mocked(method).mock.calls);
        expect(JSON.stringify(logged)).not.toContain(PROGRAM_ADDRESS);
    });

    it('should explain a file that the browser cannot read', async () => {
        renderDialog(PROGRAM_ADDRESS);
        const file = Object.assign(new File([IDL_TEXT], 'amm_v3.json'), {
            text: () => Promise.reject(new DOMException('changed', 'NotReadableError')),
        });

        fireEvent.change(screen.getByLabelText('Anchor or Codama IDL file'), { target: { files: [file] } });

        expect(await screen.findByRole('alert')).toHaveTextContent('The browser could not read this file.');
    });

    it('should keep the text of the last picked file when an earlier read ends later', async () => {
        renderDialog(PROGRAM_ADDRESS);
        let finishFirstRead: (text: string) => void = () => undefined;
        const first = Object.assign(new File(['{}'], 'first.json'), {
            text: () => new Promise<string>(resolve => (finishFirstRead = resolve)),
        });
        const last = Object.assign(new File([IDL_TEXT], 'last.json'), { text: async () => IDL_TEXT });
        const input = screen.getByLabelText('Anchor or Codama IDL file');

        fireEvent.change(input, { target: { files: [first] } });
        fireEvent.change(input, { target: { files: [last] } });
        await waitFor(() => expect(screen.getByLabelText('Or paste the IDL JSON')).toHaveValue(IDL_TEXT));
        await act(async () => finishFirstRead('{"from":"first"}'));

        expect(screen.getByLabelText('Or paste the IDL JSON')).toHaveValue(IDL_TEXT);
    });

    it('should store an uploaded file under its file name', async () => {
        const { onOpenChange, store } = renderDialog(PROGRAM_ADDRESS);

        const file = Object.assign(new File([IDL_TEXT], 'amm_v3.json'), { text: async () => IDL_TEXT });
        fireEvent.change(screen.getByLabelText('Anchor or Codama IDL file'), { target: { files: [file] } });
        await waitFor(() => expect(screen.getByLabelText('Or paste the IDL JSON')).toHaveValue(IDL_TEXT));
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(recordOf(store)?.origin).toEqual({ fileName: 'amm_v3.json', kind: 'file' });
    });

    it('should store the text of a picked file as pasted once the user edits it', async () => {
        const { onOpenChange, store } = renderDialog(PROGRAM_ADDRESS);
        const file = Object.assign(new File([IDL_TEXT], 'amm_v3.json'), { text: async () => IDL_TEXT });
        fireEvent.change(screen.getByLabelText('Anchor or Codama IDL file'), { target: { files: [file] } });
        await waitFor(() => expect(screen.getByLabelText('Or paste the IDL JSON')).toHaveValue(IDL_TEXT));

        submitPasted(JSON.stringify({ ...anchorModernIdl, docs: ['edited'] }));

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(recordOf(store)?.origin).toEqual({ kind: 'pasted' });
    });
});

function renderDialog(programAddress: string) {
    const store = createStore();
    const onOpenChange = vi.fn();
    render(
        <JotaiProvider store={store}>
            <CustomIdlUploadDialog
                programAddress={programAddress}
                isReplacing={false}
                open
                onOpenChange={onOpenChange}
            />
        </JotaiProvider>,
    );
    return { onOpenChange, store };
}

function submitPasted(text: string) {
    fireEvent.change(screen.getByLabelText('Or paste the IDL JSON'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
}

function recordOf(store: ReturnType<typeof createStore>) {
    const state = store.get(customIdlStoreAtom);
    return state.status === 'ready' ? state.records.get(PROGRAM_ADDRESS) : undefined;
}
