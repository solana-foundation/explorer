import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';
import * as React from 'react';

export type StatusType = 'active' | 'inactive' | 'pending';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: StatusType;
    label: string;
    showIcon?: boolean;
}

export function StatusBadge({ status, label, showIcon = true, className, ...props }: StatusBadgeProps) {
    return (
        <Badge status={status as any} className={cn('e:text-white', className)} {...props}>
            {label}
            {showIcon && (
                <span
                    className={`ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full ${getStatusColor(
                        status
                    )} text-[10px]`}
                >
                    {getStatusIcon(status)}
                </span>
            )}
        </Badge>
    );
}

function getStatusColor(status: StatusType): string {
    switch (status) {
        case 'active':
            return 'e:bg-[#1E5E32]';
        case 'inactive':
            return 'e:bg-[#423500]';
        case 'pending':
            return 'e:bg-yellow-500';
        default:
            return 'e:bg-gray-400';
    }
}

function getStatusIcon(status: StatusType): string {
    switch (status) {
        case 'active':
            return '✓';
        case 'inactive':
            return '✗';
        case 'pending':
            return '⋯';
        default:
            return '?';
    }
}
