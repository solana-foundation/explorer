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
                'flex h-6 w-full items-center gap-1 border-0 bg-transparent px-2 text-[11px] leading-none tracking-[-0.44px] text-neutral-200 hover:bg-outer-space-800',
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
