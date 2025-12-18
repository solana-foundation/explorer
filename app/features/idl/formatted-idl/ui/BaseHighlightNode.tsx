import { cn } from '@components/shared/utils';
import * as React from 'react';

export interface BaseHighlightNodeProps extends React.ComponentPropsWithoutRef<'mark'> {
    isActive?: boolean;
}

export const BaseHighlightNode = React.forwardRef<HTMLElement, BaseHighlightNodeProps>(
    ({ children, className, isActive = true, ...props }, ref) => {
        if (!isActive) return <>{children}</>;

        return (
            <mark
                className={cn(
                    'e-text-current',
                    'e-p-0',
                    'e-outline e-outline-dashed e-outline-1 e-outline-offset-0',
                    'e-outline-accent',
                    // TODO: Background color is inline, because e-bg-accent-900/50 is not working
                    // Update when fixed
                    'e-bg-[color-mix(in_oklch,theme(colors.accent.900),transparent_50%)]',
                    className
                )}
                {...props}
                ref={ref}
            >
                {children}
            </mark>
        );
    }
);
BaseHighlightNode.displayName = 'BaseHighlightNode';
