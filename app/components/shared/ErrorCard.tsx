import React from 'react';

import { cn } from './utils';

export function ErrorCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cn('e-card', className)}>
            <div className="e-card-body e-p-1 e-text-center">{message || 'Error'}</div>
        </div>
    );
}
