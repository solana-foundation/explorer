import React from 'react';

import { CardBody } from '@/app/shared/ui/Card';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <div className="card">
            <CardBody ui="dashkit" className="e-text-center">
                <span className="e-spinner-grow e-spinner-grow-sm e-mr-1.5 e-align-text-top"></span>
                {message || 'Loading'}
            </CardBody>
        </div>
    );
}
