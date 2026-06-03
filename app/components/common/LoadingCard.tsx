import React from 'react';

import { CardBody } from '@/app/shared/ui/Card';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <div className="card">
            <CardBody ui="dashkit" className="text-center">
                <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                {message || 'Loading'}
            </CardBody>
        </div>
    );
}
