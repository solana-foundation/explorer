import React from 'react';

import { baseCardVariants, CardBody } from '@/app/shared/ui/Card';

import { cnPrefixed } from './utils';

export function ErrorCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cnPrefixed(baseCardVariants({ ui: 'dashkit' }), className)}>
            <CardBody ui="dashkit" className="!p-1 text-center">
                {message || 'Error'}
            </CardBody>
        </div>
    );
}
