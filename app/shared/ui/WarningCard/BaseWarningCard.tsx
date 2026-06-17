import { cn } from '@components/shared/utils';
import { Slot } from '@radix-ui/react-slot';
import { ReactNode } from 'react';
import { AlertTriangle } from 'react-feather';

interface BaseWarningCardProps {
    className?: string;
    message?: string;
    description?: string;
    children?: ReactNode;
    asChild?: boolean;
}

export function BaseWarningCard({ className, message, description, children, asChild = false }: BaseWarningCardProps) {
    const baseClassName = cn('flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4', className);

    if (asChild) {
        return <Slot className={baseClassName}>{children}</Slot>;
    }

    const content = message ? (
        <div className="text-sm text-orange-800">
            <div>{message}</div>
            {description && <div className="mt-1 text-xs opacity-80">{description}</div>}
        </div>
    ) : (
        <div className="text-sm text-orange-800">{children}</div>
    );

    return (
        <div className={baseClassName}>
            <AlertTriangle size={16} className="text-orange-600" />
            {content}
        </div>
    );
}
