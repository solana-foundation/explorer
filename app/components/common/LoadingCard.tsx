import React from 'react';

import { Card, CardBody } from '@/app/shared/ui/Card';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit" className="text-center">
                <span className="spinner-grow spinner-grow-sm mr-1.5 align-text-top"></span>
                {message || 'Loading'}
            </CardBody>
        </Card>
    );
}
