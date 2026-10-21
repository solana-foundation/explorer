import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type KeyValueRowInput, KeyValueRows } from '../KeyValueRows';

describe('KeyValueRows', () => {
    it('should render truthy rows and omit falsy entries', () => {
        const hidden = false;
        const rows: KeyValueRowInput[] = [
            { label: 'Shown object', value: 'a' },
            hidden && { label: 'Hidden by false', value: 'b' },
            null,
            undefined,
            { label: 'Also shown', value: 'c' },
        ];

        render(<KeyValueRows rows={rows} />);

        expect(screen.getByText('Shown object')).toBeInTheDocument();
        expect(screen.getByText('Also shown')).toBeInTheDocument();
        expect(screen.queryByText('Hidden by false')).toBeNull();
    });

    it('should keep a JSX-labelled row mounted when a preceding row toggles visibility', () => {
        const buildRows = (showFirst: boolean): KeyValueRowInput[] => [
            showFirst && { label: 'Toggles', value: 'x' },
            { label: <span>JSX label</span>, value: <input data-testid="stateful" /> },
        ];

        const { rerender } = render(<KeyValueRows rows={buildRows(true)} />);
        const before = screen.getByTestId('stateful');
        before.focus();
        expect(before).toHaveFocus();

        rerender(<KeyValueRows rows={buildRows(false)} />);

        // Stable keying off the original index means hiding the row above does not remount this one.
        expect(screen.getByTestId('stateful')).toHaveFocus();
    });
});
