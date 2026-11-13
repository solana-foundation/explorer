import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { GridTable, type GridTableColumn } from '../GridTable';

type Row = { id: string; a: string; b: string };

const ROWS: Row[] = [{ a: 'alpha', b: 'beta', id: '1' }];

const COLUMNS: ReadonlyArray<GridTableColumn<Row>> = [
    { header: 'A', render: row => row.a },
    { header: 'B', hideOnMobile: true, render: row => row.b },
    { header: 'C', mobileLabel: 'C-mobile', render: () => 'cval' },
    { header: 'D', mobileRender: () => 'd-mobile', render: () => 'd-desktop' },
];

function renderStack(rows: Row[] = ROWS, empty?: ReactNode) {
    render(
        <GridTable
            ariaLabel="Example"
            columns={COLUMNS}
            empty={empty}
            getRowKey={row => row.id}
            gridTemplate="grid-cols-4"
            mobile="stack"
            rows={rows}
        />,
    );
}

// `mobile="stack"` renders the desktop grid and the mobile stack together, so a value shown in both
// layouts appears twice; counting occurrences tells the two projections apart without DOM traversal.
describe('GridTable mobile="stack"', () => {
    it('should drop hideOnMobile columns, fall back mobileLabel to header, and override render with mobileRender', () => {
        renderStack();

        // hideOnMobile: column B's header and value appear only in the desktop grid.
        expect(screen.getAllByText('B')).toHaveLength(1);
        expect(screen.getAllByText('beta')).toHaveLength(1);

        // mobileLabel: header 'A' (no mobile label) labels both layouts; 'C' uses 'C-mobile' on mobile only.
        expect(screen.getAllByText('A')).toHaveLength(2);
        expect(screen.getAllByText('C')).toHaveLength(1);
        expect(screen.getByText('C-mobile')).toBeInTheDocument();

        // mobileRender: desktop keeps 'd-desktop', mobile swaps in 'd-mobile'.
        expect(screen.getAllByText('d-desktop')).toHaveLength(1);
        expect(screen.getByText('d-mobile')).toBeInTheDocument();
    });

    it('should expose table semantics on the mobile stack layout', () => {
        renderStack();

        // Both the desktop grid and the mobile stack carry role="table" with the shared aria-label.
        expect(screen.getAllByRole('table', { name: 'Example' })).toHaveLength(2);

        // Mobile fields keep the label->value relationship as rowheader/cell pairs.
        const labels = screen.getAllByRole('rowheader');
        expect(labels.map(el => el.textContent)).toEqual(['A', 'C-mobile', 'D']);
    });

    it('should render the empty node in both layouts', () => {
        renderStack([], 'Nothing here');

        expect(screen.getAllByText('Nothing here')).toHaveLength(2);
    });

    it('should render no placeholder when empty is null', () => {
        renderStack([], null);

        expect(screen.queryByText('No data')).not.toBeInTheDocument();
    });
});
