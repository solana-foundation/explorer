import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Drop-in replacement for Bootstrap's `.container`. Max-widths and padding
// mirror dashkit's `$container-max-widths` (sm 540 / md 720 / lg 960 / xl 1140)
// and `$container-padding-x` (0.75rem = e-px-3).
const PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'e-mx-auto e-w-full e-px-3 sm:e-max-w-[540px] md:e-max-w-[720px] lg:e-max-w-[960px] xl:e-max-w-[1140px]',
                className,
            )}
            {...props}
        />
    ),
);
PageContainer.displayName = 'PageContainer';

export { PageContainer };
