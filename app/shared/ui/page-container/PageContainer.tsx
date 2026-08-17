import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Drop-in replacement for Bootstrap's `.container`. The redesign uses a single fluid cap
// (max-w-[1400px]) with a responsive gutter (16→20→24→32→40→48px) instead of the stepped
// dashkit `$container-max-widths`; the page's content column is capped separately via
// `max-w-col mx-auto` wrappers inside the container.
const pageContainerVariants = cva('mx-auto w-full max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 xxl:px-12', {
    defaultVariants: { variant: 'default' },
    variants: {
        variant: {
            default: '',
            // Bootstrap `.mt-n3` — pulls the container up under the page header's bottom padding
            'pulled-up': '-mt-dk-3',
        },
    },
});

type PageContainerProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof pageContainerVariants>;

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(pageContainerVariants({ variant }), className)} {...props} />
));
PageContainer.displayName = 'PageContainer';

export { PageContainer };
