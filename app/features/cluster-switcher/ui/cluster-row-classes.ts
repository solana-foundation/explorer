import { cn } from '@components/shared/utils';

const ROW_BASE =
    'flex w-full cursor-pointer justify-between gap-3 rounded-md border border-solid px-3 py-2 text-sm font-medium text-white no-underline transition-colors [@media(hover:hover)]:hover:border-white/10 [@media(hover:hover)]:hover:bg-outer-space-800 [@media(hover:hover)]:hover:text-white';

export const ACTIVE_ROW = 'border-white/10 bg-outer-space-800';
export const INACTIVE_ROW = 'border-transparent bg-transparent';

export function rowClasses({ active, stacked }: { active?: boolean; stacked?: boolean } = {}) {
    return cn(ROW_BASE, stacked ? 'items-start' : 'items-center', active ? ACTIVE_ROW : INACTIVE_ROW);
}

export const MENU_FIELD_BORDER = '!border-neutral-600';
export const MENU_SECONDARY_BUTTON = 'cursor-pointer !bg-heavy-metal-900 hover:!bg-heavy-metal-850';
export const MENU_PRIMARY_BUTTON = 'cursor-pointer !border border-solid border-transparent bg-clip-padding';
