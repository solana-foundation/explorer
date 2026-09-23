import { Button, type ButtonProps } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ChevronDown } from 'react-feather';

interface PopoverButtonProps {
    /** Menu edge pinned to the trigger; 'end' keeps right-aligned triggers from opening off-screen. */
    align?: ComponentPropsWithoutRef<typeof PopoverContent>['align'];
    /** Trailing caret. Defaults to the feather chevron the compact triggers have always drawn. */
    caret?: ReactNode;
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
    caret,
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
                <Button variant={variant} size={size} className={className} disabled={disabled || loading}>
                    {loading ? <span className="spinner-grow spinner-grow-xs mx-0.5" aria-hidden="true" /> : icon}
                    {label}
                    {caret ?? <ChevronDown size={12} aria-hidden="true" />}
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
