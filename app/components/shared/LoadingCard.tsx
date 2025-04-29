import React from 'react';

import { cn } from './utils';

export function LoadingCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cn('e-card', className)}>
            <div className="e-card-body e-p-1 e-text-center">
                <span className="e-spinner-grow e-spinner-grow-sm e-me-2 e-align-text-top"></span>
                {message || 'Loading'}
            </div>
        </div>
    );
}
