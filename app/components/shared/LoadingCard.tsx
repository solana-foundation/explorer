// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import React from 'react';

import { baseCardVariants, CardBody } from '@/app/shared/ui/Card';

import { cnPrefixed } from './utils';

export function LoadingCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cnPrefixed(baseCardVariants({ ui: 'dashkit' }), className)}>
            <CardBody ui="dashkit" className="!p-1 text-center">
                <span className="spinner-grow spinner-grow-sm me-2 align-text-top"></span>
                {message || 'Loading'}
            </CardBody>
        </div>
    );
}
