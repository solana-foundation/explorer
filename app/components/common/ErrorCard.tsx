import React from 'react';

import { Card, CardBody } from '@/app/shared/ui/Card';

export function ErrorCard({
    retry,
    retryText,
    text,
    subtext,
}: {
    retry?: () => void;
    retryText?: string;
    text: string;
    subtext?: string;
}) {
    const buttonText = retryText || 'Try Again';
    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit" className="e-text-center">
                {text}
                {retry && (
                    <>
                        <span className="btn btn-white e-ml-3 e-hidden md:e-inline" onClick={retry}>
                            {buttonText}
                        </span>
                        <div className="e-mt-6 e-block md:e-hidden">
                            <span className="btn btn-white e-w-full" onClick={retry}>
                                {buttonText}
                            </span>
                        </div>
                        {subtext && (
                            <div className="e-text-dk-gray-700">
                                <hr></hr>
                                {subtext}
                            </div>
                        )}
                    </>
                )}
            </CardBody>
        </Card>
    );
}
