import { cn } from '@components/shared/utils';
import type { ReactNode } from 'react';

interface PopoverMenuItemProps {
    icon?: ReactNode;
    label: string;
    disabled?: boolean;
    onClick: () => void;
}

export function PopoverMenuItem({ icon, label, disabled, onClick }: PopoverMenuItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                // h-7 at every width: 28px leaves room for a finger on a phone and reads the same
                // under a desktop pointer, so the menu has no breakpoint of its own.
                'flex h-7 w-full items-center gap-1 rounded border border-solid border-transparent bg-transparent pl-1 pr-1.5 text-sm leading-none tracking-[-0.44px] text-neutral-200 transition-colors hover:border-white/10 hover:bg-outer-space-800 [&_svg]:size-4',
                {
                    'cursor-not-allowed opacity-50': disabled,
                },
            )}
        >
            {icon}
            {label}
        </button>
    );
}
