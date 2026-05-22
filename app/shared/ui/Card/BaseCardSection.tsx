import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const sectionVariants = cva('e-mb-6', {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            // Dashkit-faithful approximation; dashkit ships no exact equivalent so this leans
            // on dk-* surface colors with the same uppercase-tiny-label visual rhythm.
            dashkit: '',
            tw: '',
        },
    },
});

const sectionTitleVariants = cva(
    'e-px-6 e-py-4 e-text-[10px] e-font-medium e-uppercase e-tracking-widest e-border e-border-solid',
    {
        defaultVariants: { ui: 'tw' },
        variants: {
            ui: {
                dashkit: 'e-border-dk-gray-700-dark e-bg-dk-gray-800-dark e-text-dk-gray-600',
                tw: 'e-border-neutral-800 e-bg-neutral-900 e-text-gray-400',
            },
        },
    },
);

interface BaseCardSectionProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
        VariantProps<typeof sectionVariants> {
    title: string;
    children?: React.ReactNode;
}

export function BaseCardSection({ className, children, title, ui, ...props }: BaseCardSectionProps) {
    return (
        <div className={cn(sectionVariants({ ui }), className)} {...props}>
            <h3 className={sectionTitleVariants({ ui })}>{title}</h3>
            {children}
        </div>
    );
}
