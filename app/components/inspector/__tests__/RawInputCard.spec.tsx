import {
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransaction,
    compileTransactionMessage,
    createNoopSigner,
    createTransactionMessage,
    getBase58Decoder,
    getBase64Decoder,
    getCompiledTransactionMessageEncoder,
    getTransactionEncoder,
    lamports,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { describe, expect, test, vi } from 'vitest';

import { EXAMPLE_LABEL } from '../BaseCodeExample';
import {
    EXAMPLE_CLI_FOCUS,
    EXAMPLE_SQUADS_VAULT_TRANSACTION,
    kitExample,
    RUST_PRINT_LINE,
    rustExample,
} from '../inspector-examples';
import { RawInput } from '../RawInputCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

describe('RawInput', () => {
    beforeEach(() => {
        vi.mocked(usePathname).mockReturnValue('/tx/inspector');
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
        );
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace: vi.fn() } as unknown as ReturnType<
            typeof useRouter
        >);
    });

    test('should focus the input on mount and hides Clear while it is empty', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.getByLabelText('Inspector input')).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    test('should show Clear for typed input and empty the field on click', () => {
        const setTransactionData = vi.fn();
        render(<RawInput setTransactionData={setTransactionData} />);
        const input = screen.getByLabelText<HTMLTextAreaElement>('Inspector input');

        fireEvent.input(input, { target: { value: 'not-a-transaction!' } });
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Input must be base58/base64 encoded or a valid account address',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(input.value).toBe('');
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(setTransactionData).toHaveBeenLastCalledWith(undefined);
    });

    test('should explain the instructions below the input', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.getByRole('heading', { name: 'How to get the input for the field above' })).toBeInTheDocument();
    });

    test('should show an example in every instructions tab', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.getAllByText(EXAMPLE_LABEL)).toHaveLength(4);
        expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
        // Each tab marks the part the reader should copy or look for.
        for (const focus of [
            EXAMPLE_CLI_FOCUS,
            rustExample('base64').focus,
            kitExample('base64').focus,
            EXAMPLE_SQUADS_VAULT_TRANSACTION,
        ]) {
            // Highlighting splits the marked text into spans, so match on the mark's whole text content.
            expect(
                screen.getByText((_content, element) => element?.tagName === 'MARK' && element.textContent === focus),
            ).toBeInTheDocument();
        }
    });

    // `{}` inside JSX text is an empty expression, so the Rust format string must be written as `{'{}'}`.
    test('should print the Rust format placeholder in the instruction', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(
            screen.getByText('println!("{}", base64::encode(&transaction.message_data()));', { selector: 'code' }),
        ).toBeInTheDocument();
    });

    test('should switch the instruction panel when a tab is clicked', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.getByRole('tab', { name: 'CLI' })).toHaveAttribute('aria-selected', 'true');
        fireEvent.click(screen.getByRole('tab', { name: 'Rust' }));

        expect(screen.getByRole('tab', { name: 'Rust' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel')).toHaveTextContent('crate dependency');
    });

    test('should show base58 in every tab that offers the choice', () => {
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams('encoding=base58') as unknown as ReturnType<typeof useSearchParams>,
        );
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.getByText(RUST_PRINT_LINE.base58, { selector: 'code' })).toBeInTheDocument();
        expect(
            screen.getByText(
                (_content, element) =>
                    element?.tagName === 'MARK' && element.textContent === kitExample('base58').focus,
            ),
        ).toBeInTheDocument();
    });

    test('should keep the shared encoding in the URL', () => {
        const replace = vi.fn();
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace } as unknown as ReturnType<typeof useRouter>);
        render(<RawInput setTransactionData={vi.fn()} />);

        fireEvent.click(screen.getByRole('tab', { name: 'Rust' }));
        fireEvent.click(screen.getByRole('button', { name: 'base58' }));

        expect(replace).toHaveBeenCalledWith('/tx/inspector?encoding=base58', { scroll: false });
    });

    test('should point Squads imports at the base58 transaction message', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        fireEvent.click(screen.getByRole('tab', { name: 'Squads' }));

        expect(screen.getByRole('heading', { name: 'Bringing a transaction into Squads?' })).toBeInTheDocument();
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Squads imports base58 transaction messages.');
    });

    test('should offer no encoding switch on the CLI tab', () => {
        render(<RawInput setTransactionData={vi.fn()} />);

        expect(screen.queryByRole('button', { name: 'base58' })).toBeNull();
    });

    // Mirrors the Kit snippets with real addresses: both print lines must be accepted in either encoding.
    test.each([
        ['base64', 'wire'],
        ['base58', 'wire'],
        ['base64', 'message'],
        ['base58', 'message'],
    ] as const)('should accept the %s %s output of the Kit snippets', (encoding, kind) => {
        const from = createNoopSigner(address('6tgR1upn2bsMdiprpfUAWmoniEJ8E1XVF8f9gLmWqyTS'));
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayerSigner(from, m),
            m =>
                setTransactionMessageLifetimeUsingBlockhash(
                    { blockhash: blockhash('AzZUmpD34LwkNoeZuxCdRyosBji9q4ddmgUCtBQLpi5D'), lastValidBlockHeight: 0n },
                    m,
                ),
            m =>
                appendTransactionMessageInstruction(
                    getTransferSolInstruction({
                        amount: lamports(100_000_000n),
                        destination: address('5WLJCrKpmin5PTU53ubQwNrsSBd7BFzuDFeLnrupSDv2'),
                        source: from,
                    }),
                    m,
                ),
        );
        const bytes =
            kind === 'wire'
                ? getTransactionEncoder().encode(compileTransaction(message))
                : getCompiledTransactionMessageEncoder().encode(compileTransactionMessage(message));
        const printed = encoding === 'base64' ? getBase64Decoder().decode(bytes) : getBase58Decoder().decode(bytes);
        const setTransactionData = vi.fn();
        render(<RawInput setTransactionData={setTransactionData} />);

        fireEvent.input(screen.getByLabelText('Inspector input'), { target: { value: printed } });

        expect(screen.queryByRole('alert')).toBeNull();
        expect(setTransactionData).toHaveBeenLastCalledWith(expect.objectContaining({ message: expect.anything() }));
    });
});
