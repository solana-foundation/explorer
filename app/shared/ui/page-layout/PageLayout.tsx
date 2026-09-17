import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cnPrefixed } from '@/app/components/shared/utils';

const pageLayoutVariants = cva(
    // `::selection` can't resolve the `accent` token's opacity form (it compiles to a color-mix/CSS
    // variable the pseudo-element drops), so the highlight is spelled as the literal accent hex at 25%
    // (`#13d89b` === the `accent` token) to keep the translucent selection consistent across pages.
    'mx-auto flex flex-col px-4 pt-3 selection:bg-[#13d89b40] selection:text-inherit lg:px-6 lg:pt-5',
    {
        defaultVariants: { width: 'default' },
        variants: {
            // Content column max-width. `default` caps at the detail-page width; `full` spans the parent.
            width: {
                default: 'max-w-5xl',
                full: 'max-w-none',
            },
        },
    },
);

export interface PageLayoutProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof pageLayoutVariants> {}

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(({ className, width, ...props }, ref) => (
    <div ref={ref} className={cnPrefixed(pageLayoutVariants({ width }), className)} {...props} />
));
PageLayout.displayName = 'PageLayout';

export { PageLayout, pageLayoutVariants };
