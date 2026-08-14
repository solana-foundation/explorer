// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

import { Button, type ButtonProps } from './button';

export interface TileButtonProps extends Omit<ButtonProps, 'size'> {
    icon: React.ReactNode;
}

// Tall icon-over-label action tile (e.g. slideover footer actions). Composes `Button` with the
// `size="tile"` layout and a sensible default width so callers don't reach for inline `w-*` classes.
export const TileButton = React.forwardRef<HTMLButtonElement, TileButtonProps>(
    ({ icon, children, className, ...props }, ref) => (
        <Button ref={ref} size="tile" className={cn('w-20', className)} {...props}>
            {icon}
            {children}
        </Button>
    ),
);
TileButton.displayName = 'TileButton';
