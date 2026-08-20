import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const pageContainerVariants = cva('mx-auto w-full max-w-[1400px] px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 xxl:px-12', {
    defaultVariants: { variant: 'default' },
    variants: {
        variant: {
            default: '',
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
