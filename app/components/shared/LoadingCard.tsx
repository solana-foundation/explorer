import React from 'react';

import { baseCardVariants, CardBody } from '@/app/shared/ui/Card';

import { cnPrefixed } from './utils';

export function LoadingCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cnPrefixed(baseCardVariants({ ui: 'dashkit' }), className)}>
            <CardBody ui="dashkit" className="!e-p-1 e-text-center">
                <span className="e-spinner-grow e-spinner-grow-sm e-me-2 e-align-text-top"></span>
                {message || 'Loading'}
            </CardBody>
        </div>
    );
}
