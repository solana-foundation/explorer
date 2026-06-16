import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const sectionVariants = cva('mb-6', {
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
    'px-6 py-4 text-[10px] font-medium uppercase tracking-widest border border-solid',
    {
        defaultVariants: { ui: 'tw' },
        variants: {
            ui: {
                dashkit: 'border-dk-gray-700-dark bg-dk-gray-800-dark text-dk-gray-600',
                tw: 'border-neutral-800 bg-neutral-900 text-gray-400',
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
