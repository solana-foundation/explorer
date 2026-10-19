import { createIndexedDbCustomIdlStorage, customIdlStorage } from '@entities/idl/api/custom-idl-storage';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorNoAddressIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CUSTOM_IDL_SAVE_FAILED_MESSAGE } from '@/app/entities/idl';
import { Cluster } from '@/app/utils/cluster';

import { CustomIdlCatalog } from '../CustomIdlCatalog';
import { CustomIdlCatalogTrigger } from '../CustomIdlCatalogTrigger';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock('next/navigation');
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, onClick }: { children: ReactNode; href: string; onClick?: () => void }) => (
        <a
            href={href}
            onClick={event => {
                event.preventDefault();
                onClick?.();
            }}
        >
            {children}
        </a>
    ),
}));
vi.mock('@components/shared/ui/sonner/use-toast', () => ({ useToast: () => ({ custom: mocks.toast }) }));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.Devnet, url: 'https://api.devnet.solana.com' }),
}));

const MODERN_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const CODAMA_ADDRESS = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
const NO_ADDRESS_PROGRAM = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

describe('CustomIdlCatalog', () => {
    beforeEach(() => mocks.toast.mockClear());
    afterEach(() => vi.restoreAllMocks());

    describe('in a dialog', () => {
        beforeEach(() => setViewport('desktop'));

        it('should list the stored programs by name and show the first one', async () => {
            await storeIdl(CODAMA_ADDRESS, codamaIdl);
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();

            const list = await screen.findByRole('navigation', { name: 'Programs with a custom IDL' });
            await waitFor(() =>
                expect(
                    within(list)
                        .getAllByRole('button')
                        .map(button => button.textContent),
                ).toEqual(['Add IDL', 'Amm V3devi..EAtH', 'Program MetadataProg..nk7S']),
            );
            expect(within(list).getByRole('button', { current: true })).toHaveTextContent('Amm V3');
            expect(screen.getByRole('link', { name: MODERN_ADDRESS })).toHaveAttribute(
                'href',
                `/address/${MODERN_ADDRESS}/idl`,
            );
            expect(screen.getByLabelText('Anchor', { exact: false })).toHaveTextContent('"name": "amm_v3"');
        });

        it('should say that the browser blocks storage', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            vi.spyOn(indexedDB, 'open').mockImplementation(() => {
                throw new DOMException('blocked', 'SecurityError');
            });
            renderCatalog();

            expect(
                await screen.findByText('This browser blocks storage for the Explorer', { exact: false }),
            ).toBeInTheDocument();
            expect(screen.queryByLabelText('Or paste the IDL JSON')).not.toBeInTheDocument();
        });

        it('should say that the Explorer could not load the custom IDLs', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            vi.resetModules();
            vi.doMock('@/app/entities/idl/model/custom-idl/can-decoder-load', () => {
                throw new Error('ChunkLoadError');
            });
            try {
                const { CustomIdlCatalog: CatalogWithoutDecoders } = await import('../CustomIdlCatalog');
                render(
                    <JotaiProvider store={createStore()}>
                        <CatalogWithoutDecoders open onOpenChange={vi.fn()} />
                    </JotaiProvider>,
                );

                expect(
                    await screen.findByText('The Explorer could not load the custom IDLs', { exact: false }),
                ).toBeInTheDocument();
                expect(screen.queryByLabelText('Or paste the IDL JSON')).not.toBeInTheDocument();
            } finally {
                vi.doUnmock('@/app/entities/idl/model/custom-idl/can-decoder-load');
            }
        });

        it('should list no program for stored values it cannot read, and remove every one of them', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            await customIdlStorage.put({ programAddress: 'not-an-address', value: '{not json' });
            await customIdlStorage.put({ programAddress: 'another-key', value: '[]' });
            renderCatalog();

            expect(
                await screen.findByText('This browser keeps 2 IDLs that the Explorer cannot read.'),
            ).toBeInTheDocument();
            const list = screen.getByRole('navigation', { name: 'Programs with a custom IDL' });
            expect(within(list).getAllByRole('button')).toHaveLength(2);

            await userEvent.click(screen.getByRole('button', { name: 'Remove unreadable IDLs' }));

            await waitFor(() =>
                expect(screen.queryByText('that the Explorer cannot read', { exact: false })).not.toBeInTheDocument(),
            );
            expect(await storedValue('not-an-address')).toBeUndefined();
            expect(await storedValue('another-key')).toBeUndefined();
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(anchorModernIdl);
        });

        it('should add an IDL under the address that the IDL declares', async () => {
            renderCatalog();

            await pasteIdl(JSON.stringify(anchorModernIdl));
            await userEvent.click(screen.getByRole('button', { name: 'Add' }));

            expect(await screen.findByRole('link', { name: MODERN_ADDRESS })).toBeInTheDocument();
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(anchorModernIdl);
        });

        it('should ask for the address of an IDL that declares none, then store the IDL under it', async () => {
            renderCatalog();

            await pasteIdl(JSON.stringify(anchorNoAddressIdl));
            await userEvent.click(screen.getByRole('button', { name: 'Add' }));
            expect(await screen.findByRole('alert')).toHaveTextContent(
                'This IDL does not declare its program. Enter the program address.',
            );

            await userEvent.type(screen.getByLabelText('Program address'), NO_ADDRESS_PROGRAM);
            await userEvent.click(screen.getByRole('button', { name: 'Add' }));

            expect(await screen.findByRole('link', { name: NO_ADDRESS_PROGRAM })).toBeInTheDocument();
            expect(await storedIdl(NO_ADDRESS_PROGRAM)).toEqual(anchorNoAddressIdl);
        });

        it.each([
            ['an address that is not base58', 'not-an-address', 'The program address is not a valid Solana address.'],
            [
                'an address other than the declared one',
                CODAMA_ADDRESS,
                `This IDL is for program ${MODERN_ADDRESS}, not ${CODAMA_ADDRESS}.`,
            ],
        ])('should reject %s and store nothing', async (_, address, message) => {
            renderCatalog();

            await userEvent.type(await screen.findByLabelText('Program address'), address);
            await pasteIdl(JSON.stringify(anchorModernIdl));
            await userEvent.click(screen.getByRole('button', { name: 'Add' }));

            expect(await screen.findByRole('alert')).toHaveTextContent(message);
            expect(await customIdlStorage.list()).toEqual({ entries: [], ok: true });
        });

        it('should say that the declared address is invalid when the IDL declares one that is not base58', async () => {
            renderCatalog();

            await pasteIdl(JSON.stringify({ ...anchorModernIdl, address: 'not-an-address' }));
            await userEvent.click(screen.getByRole('button', { name: 'Add' }));

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'The program address that this IDL declares is not a valid Solana address.',
            );
        });

        it('should replace the IDL with the edited JSON', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();
            const edited = { ...anchorModernIdl, metadata: { ...anchorModernIdl.metadata, name: 'amm_v4' } };

            await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
            expect(screen.getByLabelText('Or paste the IDL JSON')).toHaveValue(
                JSON.stringify(anchorModernIdl, undefined, 2),
            );
            await pasteIdl(JSON.stringify(edited));
            await userEvent.click(screen.getByRole('button', { name: 'Save' }));

            expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(edited);
        });

        it('should keep the stored IDL when an edit names another program', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();

            await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
            await pasteIdl(JSON.stringify(codamaIdl));
            await userEvent.click(screen.getByRole('button', { name: 'Save' }));

            expect(await screen.findByRole('alert')).toHaveTextContent(
                `This IDL is for program ${CODAMA_ADDRESS}, not ${MODERN_ADDRESS}.`,
            );
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(anchorModernIdl);
        });

        it('should keep the stored IDL when the edit is cancelled', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();

            await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
            await pasteIdl('{}');
            await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

            expect(screen.getByLabelText('Anchor', { exact: false })).toHaveTextContent('"name": "amm_v3"');
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(anchorModernIdl);
        });

        it('should remove the IDL and show the next program', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            await storeIdl(CODAMA_ADDRESS, codamaIdl);
            renderCatalog();

            await screen.findByRole('link', { name: MODERN_ADDRESS });
            await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

            expect(await screen.findByRole('link', { name: CODAMA_ADDRESS })).toBeInTheDocument();
            expect(await storedIdl(MODERN_ADDRESS)).toBeUndefined();
        });

        it('should show the first program when another tab removes the open one', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            await storeIdl(CODAMA_ADDRESS, codamaIdl);
            renderCatalog();
            await userEvent.click(await screen.findByText('Program Metadata'));

            await createIndexedDbCustomIdlStorage().remove(CODAMA_ADDRESS);

            expect(await screen.findByRole('link', { name: MODERN_ADDRESS })).toBeInTheDocument();
        });

        it('should keep the program when the browser refuses the removal', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            vi.spyOn(customIdlStorage, 'remove').mockResolvedValue({ ok: false, reason: 'unavailable' });
            renderCatalog();

            await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));

            await waitFor(() =>
                expect(mocks.toast).toHaveBeenCalledWith({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' }),
            );
            expect(screen.getByRole('link', { name: MODERN_ADDRESS })).toBeInTheDocument();
            expect(await storedIdl(MODERN_ADDRESS)).toEqual(anchorModernIdl);
        });

        it('should report a failure when the browser refuses to remove the unreadable values', async () => {
            await customIdlStorage.put({ programAddress: 'not-an-address', value: '{not json' });
            vi.spyOn(customIdlStorage, 'remove').mockResolvedValue({ ok: false, reason: 'unavailable' });
            renderCatalog();

            await userEvent.click(await screen.findByRole('button', { name: 'Remove unreadable IDLs' }));

            await waitFor(() =>
                expect(mocks.toast).toHaveBeenCalledWith({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' }),
            );
        });

        it('should close when the user follows the link to the program', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            const { onOpenChange } = renderCatalog();

            await userEvent.click(await screen.findByRole('link', { name: MODERN_ADDRESS }));

            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe('in a drawer', () => {
        beforeEach(() => setViewport('phone'));

        it('should open a program from the list and go back to the list', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();

            await userEvent.click(await screen.findByText('Amm V3'));
            expect(screen.getByRole('link', { name: MODERN_ADDRESS })).toBeInTheDocument();
            expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: 'Back' }));
            expect(screen.getByRole('navigation', { name: 'Programs with a custom IDL' })).toBeInTheDocument();
        });

        it('should go back to the list after a removal', async () => {
            await storeIdl(MODERN_ADDRESS, anchorModernIdl);
            renderCatalog();

            await userEvent.click(await screen.findByText('Amm V3'));
            await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

            const list = await screen.findByRole('navigation', { name: 'Programs with a custom IDL' });
            expect(
                within(list)
                    .getAllByRole('button')
                    .map(button => button.textContent),
            ).toEqual(['Add IDL']);
        });
    });
});

describe('CustomIdlCatalogTrigger', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should load the catalog on the first click', async () => {
        await storeIdl(MODERN_ADDRESS, anchorModernIdl);
        const read = vi.spyOn(indexedDB, 'open');
        render(
            <JotaiProvider store={createStore()}>
                <CustomIdlCatalogTrigger>Custom IDLs</CustomIdlCatalogTrigger>
            </JotaiProvider>,
        );
        await act(() => new Promise(resolve => setTimeout(resolve, 50)));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(read).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Custom IDLs' }));

        expect(await screen.findByRole('dialog', { name: 'Custom IDLs' })).toBeInTheDocument();
        await waitFor(() => expect(read).toHaveBeenCalled());
    });
});

function renderCatalog() {
    const onOpenChange = vi.fn();
    render(
        <JotaiProvider store={createStore()}>
            <CustomIdlCatalog open onOpenChange={onOpenChange} />
        </JotaiProvider>,
    );
    return { onOpenChange };
}

function setViewport(viewport: 'desktop' | 'phone') {
    vi.spyOn(globalThis, 'matchMedia').mockImplementation(query => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: viewport === 'desktop',
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
    }));
}

// `userEvent.type` reads braces as key descriptors, so the JSON goes in as one change.
async function pasteIdl(text: string) {
    fireEvent.change(await screen.findByLabelText('Or paste the IDL JSON'), { target: { value: text } });
}

function storeIdl(programAddress: string, idl: unknown) {
    return customIdlStorage.put({
        programAddress,
        value: JSON.stringify({ idl, origin: { kind: 'pasted' }, selected: 'custom' }),
    });
}

async function storedIdl(programAddress: string): Promise<unknown> {
    const value = await storedValue(programAddress);
    return value === undefined ? undefined : JSON.parse(String(value)).idl;
}

async function storedValue(programAddress: string): Promise<unknown> {
    const read = await customIdlStorage.list();
    return read.ok ? read.entries.find(entry => entry.programAddress === programAddress)?.value : undefined;
}
