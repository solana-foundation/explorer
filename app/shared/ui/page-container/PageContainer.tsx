import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Drop-in replacement for Bootstrap's `.container`. Max-widths and padding
// mirror dashkit's `$container-max-widths` (sm 540 / md 720 / lg 960 / xl 1140)
// and `$container-padding-x` (0.75rem = px-3).
const pageContainerVariants = cva(
    'mx-auto w-full px-3 sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]',
    {
        defaultVariants: { variant: 'default' },
        variants: {
            variant: {
                default: '',
                // Bootstrap `.mt-n3` — pulls the container up under the page header's bottom padding
                'pulled-up': '-mt-dk-3',
            },
        },
    },
);

type PageContainerProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof pageContainerVariants>;

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(pageContainerVariants({ variant }), className)} {...props} />
));
PageContainer.displayName = 'PageContainer';

export { PageContainer };
