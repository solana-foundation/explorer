import { cva } from 'class-variance-authority';
import * as React from 'react';
import { Info } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';

export type StatusType = 'active' | 'inactive';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: StatusType;
    label?: string;
    showIcon?: boolean;
}

const statusBadgeIconVariants = cva('ml-1', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'e-text-[#1E5E32]',
            inactive: 'e-text-[#24D66C]',
        },
    },
});

const statusBadgeVariants = cva('border-0 ', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'e-gap-0 e-bg-[#1E5E32]',
            inactive: 'e-bg-[#423500]',
        },
    },
});

const statusBadgeTextVariants = cva('', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'e-text-[#24D66C]',
            inactive: 'e-text-[#EBC032]',
        },
    },
});

export function StatusBadge({ status, showIcon = true, className, label, ...props }: StatusBadgeProps) {
    return (
        <Badge className={cn(statusBadgeVariants({ status }), className)} {...props}>
            <div className={statusBadgeTextVariants({ status })}>{label ?? getStatusLabel(status)}</div>
            {showIcon && <span className={statusBadgeIconVariants({ status })}>{getStatusIcon(status)}</span>}
        </Badge>
    );
}

function getStatusIcon(status: StatusType): JSX.Element | null {
    switch (status) {
        case 'inactive':
            return <Info color={getIconColor(status)} size={16} />;
        case 'active':
        default:
            return null;
    }
}

export function getStatusLabel(status: StatusType): string {
    switch (status) {
        case 'inactive':
            return 'Disabled';
        case 'active':
        default:
            return 'Enabled';
    }
}

export function getIconColor(status: StatusType): string {
    switch (status) {
        case 'inactive':
            return '#EBC032';
        case 'active':
        default:
            return '#24D66C';
    }
}

export function getStatusColor(status: StatusType): string {
    switch (status) {
        case 'inactive':
            return '#EBC032';
        case 'active':
        default:
            return '#26E673';
    }
}
