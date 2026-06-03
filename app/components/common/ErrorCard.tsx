import React from 'react';

import { CardBody } from '@/app/shared/ui/Card';

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
        <div className="card">
            <CardBody ui="dashkit" className="e-text-center">
                {text}
                {retry && (
                    <>
                        <span className="btn btn-white e-ml-3 e-hidden md:e-inline" onClick={retry}>
                            {buttonText}
                        </span>
                        <div className="e-block d-md-none e-mt-6">
                            <span className="btn btn-white e-w-full" onClick={retry}>
                                {buttonText}
                            </span>
                        </div>
                        {subtext && (
                            <div className="text-muted">
                                <hr></hr>
                                {subtext}
                            </div>
                        )}
                    </>
                )}
            </CardBody>
        </div>
    );
}
