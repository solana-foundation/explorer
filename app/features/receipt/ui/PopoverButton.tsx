import { Button } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import type { ReactNode } from 'react';
import { ChevronDown } from 'react-feather';

interface PopoverButtonProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
}

export function PopoverButton({ icon, label, children, className, disabled, loading }: PopoverButtonProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="compact" size="compact" className={className} disabled={disabled || loading}>
                    {loading ? <span className="e-spinner-grow e-spinner-grow-xs" aria-hidden="true" /> : icon}
                    {label}
                    <ChevronDown size={12} aria-hidden="true" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="e-rounded-sm e-shadow-[0px_4px_20px_0px_rgba(0,0,0,0.5)]">
                {children}
            </PopoverContent>
        </Popover>
    );
}
