// Shared grid geometry for the accounts table. The header, the rows, the footer and the
// expanded (spoiler) content are separate grid containers, so they must share the exact
// same track lists to stay column-aligned.

// The last desktop track hugs the chevron icon (16px); the expand button (!w-5) is
// centered on it and overflows 2px per side into the gap / row padding to keep a sane
// hit area.
export const DESKTOP_GRID_TEMPLATE =
    'lg:grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_1rem] landscape:grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_1rem]';

// Column templates for the pre-desktop breakpoints and the column gap.
export const MOBILE_GRID_TEMPLATE =
    'grid-cols-[minmax(auto,1.75rem)_minmax(100px,auto)_1fr] sm:grid-cols-[minmax(auto,1.75rem)_1fr_auto]';
export const GRID_GAP_X = 'gap-x-0 lg:gap-x-5 landscape:gap-x-5';

// A full-width cell under everything but the number column, footer-style.
export const CONTENT_COL_SPAN = 'col-span-2 lg:col-span-4 landscape:col-span-4';

// Shared padding for the header and rows of the table.
export const CELL_PADDING = 'px-3 py-2.5';
