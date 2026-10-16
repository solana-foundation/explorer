import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type KeyValueRow, KeyValueRows } from '../KeyValueRows';

describe('KeyValueRows', () => {
    it('should render rows whose show is true, omitted, or undefined and omit show:false', () => {
        const rows: KeyValueRow[] = [
            { label: 'Shown explicitly', show: true, value: 'a' },
            { label: 'Shown by default', value: 'b' },
            { label: 'Shown when undefined', show: undefined, value: 'c' },
            { label: 'Hidden', show: false, value: 'd' },
        ];

        render(<KeyValueRows rows={rows} />);

        expect(screen.getByText('Shown explicitly')).toBeInTheDocument();
        expect(screen.getByText('Shown by default')).toBeInTheDocument();
        expect(screen.getByText('Shown when undefined')).toBeInTheDocument();
        expect(screen.queryByText('Hidden')).toBeNull();
    });

    it('should keep a JSX-labelled row mounted when a preceding row toggles visibility', () => {
        const buildRows = (showFirst: boolean): KeyValueRow[] => [
            { label: 'Toggles', show: showFirst, value: 'x' },
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
