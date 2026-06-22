import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Tokens match Dashkit-dark `.alert` + `.alert-<color>` at runtime — see app/scss/dashkit/_alert.scss.
const alertVariants = cva(
    ['relative', 'mb-6', 'rounded-dk', 'border', 'border-solid', 'px-5', 'py-3', 'text-dk-base'],
    {
        defaultVariants: { variant: 'default' },
        variants: {
            variant: {
                danger: 'border-dk-danger bg-dk-danger text-dk-white',
                default: 'border-transparent',
                info: 'border-dk-info bg-dk-info text-dk-white',
                // Louder pure-red override for flagged-account / scam warnings — see app/scss/_solana.scss `.alert-scam`.
                scam: 'border-[red] bg-[red] text-dk-white',
                success: 'border-dk-success-on-dark bg-dk-success-on-dark text-dk-gray-900',
                warning: 'border-dk-warning-on-dark bg-dk-warning-on-dark text-dk-white',
            },
        },
    },
);

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

// Urgent variants get role="alert" (assertive live region); polite ones get role="status"; default has no role.
const roleByVariant: Record<NonNullable<AlertProps['variant']>, 'alert' | 'status' | undefined> = {
    danger: 'alert',
    default: undefined,
    info: 'status',
    scam: 'alert',
    success: 'status',
    warning: 'alert',
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role={roleByVariant[variant ?? 'default']}
        className={cn(alertVariants({ variant }), className)}
        {...props}
    />
));
Alert.displayName = 'Alert';

export { Alert, alertVariants };
