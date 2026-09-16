import { cn } from '@components/shared/utils';

// Shared header chrome for the inspector's card tables (Signatures, Address Table Lookups): drop the dark
// background band so the header blends into the card, and use a subtle white/10 bottom rule instead of the
// default #282d2b separator (the first body row's top border is removed so the header owns the single
// dividing line). Pairs with BaseTable's `density="dense"` on the same table.
export const CARD_TABLE_HEADER = cn(
    '[&_thead_th]:!bg-transparent',
    '[&_thead_th]:!border-b [&_thead_th]:!border-solid [&_thead_th]:!border-white/10',
    '[&_thead_th]:!text-xs',
    '[&_tbody_tr:first-child_td]:!border-t-0',
);
