import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { JsonView } from '../JsonView';

const writeText = vi.fn().mockResolvedValue(undefined);

describe('JsonView', () => {
    beforeEach(() => {
        writeText.mockClear();
        Object.assign(navigator, { clipboard: { writeText } });
    });

    it('should render keys and typed values', () => {
        render(<JsonView src={{ count: 3, missing: null, name: 'solana', verified: true }} />);

        expect(screen.getByText('solana')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('true')).toBeInTheDocument();
        expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('should copy the whole block from the root row', () => {
        const src = { files: [{ uri: 'https://arweave.net/a' }], name: 'NFT' };
        render(<JsonView src={src} />);

        fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));

        expect(writeText).toHaveBeenCalledWith(JSON.stringify(src, null, 2));
    });

    it('should drop the whole-block button when the host has its own', () => {
        render(<JsonView src={{ chain: 'solana' }} blockCopy={false} />);

        expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy chain' })).toBeInTheDocument();
    });

    it('should copy a bare string value without quotes', () => {
        render(<JsonView src={{ subject: 'DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'Copy subject' }));

        expect(writeText).toHaveBeenCalledWith('DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG');
    });

    it('should copy a row from a click on its text', async () => {
        render(<JsonView src={{ subject: 'DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG' }} />);

        fireEvent.click(screen.getByText('DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG'));

        expect(writeText).toHaveBeenCalledWith('DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG');
        expect(await screen.findByRole('button', { name: 'Copied subject' })).toBeInTheDocument();
    });

    it('should copy a nested object as indented JSON', () => {
        render(<JsonView src={{ collection: { key: 'abc', verified: true } }} />);

        // The first button sits on the opening bracket's row, the second on the closing one; both copy the object.
        const [opening, closing] = screen.getAllByRole('button', { name: 'Copy collection' });
        fireEvent.click(opening);
        expect(writeText).toHaveBeenLastCalledWith(JSON.stringify({ key: 'abc', verified: true }, null, 2));
        fireEvent.click(closing);

        expect(writeText).toHaveBeenCalledTimes(2);
        expect(writeText).toHaveBeenLastCalledWith(JSON.stringify({ key: 'abc', verified: true }, null, 2));
    });

    it('should render bigints as their decimal string', () => {
        render(<JsonView src={{ supply: 340282366920938463463374607431768211455n }} />);

        expect(screen.getByText('340282366920938463463374607431768211455')).toBeInTheDocument();
    });

    it('should render a value that serialises itself as its JSON, not its fields', () => {
        const address = { _bn: { words: [1, 2] }, toJSON: () => '11111111111111111111111111111111' };
        render(<JsonView src={{ mint: address }} />);

        expect(screen.getByText('11111111111111111111111111111111')).toBeInTheDocument();
        expect(screen.queryByText('_bn')).not.toBeInTheDocument();
    });

    it('should render empty containers on one row', () => {
        render(<JsonView src={{ additionalMetadata: [] }} />);

        expect(screen.getByText('[]')).toBeInTheDocument();
    });
});
