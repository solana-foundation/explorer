import type { ReactNode } from 'react';

interface PopoverMenuItemProps {
    icon: ReactNode;
    label: string;
    onClick: () => void;
}

export function PopoverMenuItem({ icon, label, onClick }: PopoverMenuItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="e-flex e-w-full e-items-center e-gap-1 e-border-0 e-bg-transparent e-px-2 e-py-1.5 e-text-[11px] e-leading-none e-tracking-[-0.44px] e-text-neutral-200 hover:e-bg-outer-space-800"
        >
            {icon}
            {label}
        </button>
    );
}
