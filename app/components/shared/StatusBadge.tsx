// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
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

// dead `ml-1`/`border-0` deleted, not ported — they never resolved even with the legacy bundle, so the legacy render has no icon margin
const statusBadgeIconVariants = cva('', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'text-[#1E5E32]',
            inactive: 'text-[#24D66C]',
        },
    },
});

const statusBadgeVariants = cva('', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'gap-0 bg-[#1E5E32]',
            inactive: 'bg-[#423500]',
        },
    },
});

const statusBadgeTextVariants = cva('', {
    defaultVariants: {
        status: 'active',
    },
    variants: {
        status: {
            active: 'text-[#24D66C]',
            inactive: 'text-[#EBC032]',
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
