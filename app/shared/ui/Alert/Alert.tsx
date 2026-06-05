import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Tokens match Dashkit-dark `.alert` + `.alert-<color>` at runtime — see app/scss/dashkit/_alert.scss.
const alertVariants = cva(
    ['e-relative', 'e-mb-6', 'e-rounded-dk', 'e-border', 'e-border-solid', 'e-px-5', 'e-py-3', 'e-text-dk-base'],
    {
        defaultVariants: { variant: 'default' },
        variants: {
            variant: {
                danger: 'e-border-dk-danger e-bg-dk-danger e-text-dk-white',
                default: 'e-border-transparent',
                info: 'e-border-dk-info e-bg-dk-info e-text-dk-white',
                // Louder pure-red override for flagged-account / scam warnings — see app/scss/_solana.scss `.alert-scam`.
                scam: 'e-border-[red] e-bg-[red] e-text-dk-white',
                success: 'e-border-dk-success-on-dark e-bg-dk-success-on-dark e-text-dk-gray-900',
                warning: 'e-border-dk-warning-on-dark e-bg-dk-warning-on-dark e-text-dk-white',
            },
        },
    },
);

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

export { Alert, alertVariants };
