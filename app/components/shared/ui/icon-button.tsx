// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import * as React from 'react';

import { Button, type ButtonProps } from './button';

export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children'> {
    // Icon-only buttons have no text, so an accessible name is required.
    'aria-label': string;
    icon: React.ReactNode;
}

// Square, icon-only button. Composes `Button` with the fixed `size="icon"` footprint.
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ icon, ...props }, ref) => (
    <Button ref={ref} size="icon" {...props}>
        {icon}
    </Button>
));
IconButton.displayName = 'IconButton';
