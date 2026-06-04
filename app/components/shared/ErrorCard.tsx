import React from 'react';

import { CardBody } from '@/app/shared/ui/Card';

import { cn } from './utils';

export function ErrorCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cn('e-card', className)}>
            <CardBody ui="dashkit" className="!e-p-1 e-text-center">
                {message || 'Error'}
            </CardBody>
        </div>
    );
}
