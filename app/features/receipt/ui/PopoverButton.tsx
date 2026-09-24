import { Button, type ButtonProps } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { cn } from '@components/shared/utils';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { NormalizedChevronDown } from '@/app/shared/ui/icons/normalized';

interface PopoverButtonProps {
    /** Menu edge pinned to the trigger; 'end' keeps right-aligned triggers from opening off-screen. */
    align?: ComponentPropsWithoutRef<typeof PopoverContent>['align'];
    icon: ReactNode;
    label: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    size?: ButtonProps['size'];
    variant?: ButtonProps['variant'];
}

export function PopoverButton({
    align = 'start',
    icon,
    label,
    children,
    className,
    disabled,
    loading,
    size = 'compact',
    variant = 'compact',
}: PopoverButtonProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                {/* `group` lets the caret read the trigger's Radix data-state and flip when the menu opens. */}
                <Button variant={variant} size={size} className={cn('group', className)} disabled={disabled || loading}>
                    {loading ? <span className="spinner-grow spinner-grow-xs mx-0.5" aria-hidden="true" /> : icon}
                    {label}
                    <NormalizedChevronDown className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align={align}
                className="flex flex-col gap-1 p-1.5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.5)]"
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}
