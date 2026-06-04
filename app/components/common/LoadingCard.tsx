import React from 'react';

import { CardBody } from '@/app/shared/ui/Card';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <div className="card">
            <CardBody ui="dashkit" className="e-text-center">
                <span className="align-text-top spinner-grow spinner-grow-sm e-mr-1.5"></span>
                {message || 'Loading'}
            </CardBody>
        </div>
    );
}
