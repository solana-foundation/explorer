import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
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
                        <Button
                            ui="dashkit"
                            variant="white"
                            className="e-ml-3 e-hidden md:e-inline"
                            onClick={retry}
                            asChild
                        >
                            <span>{buttonText}</span>
                        </Button>
                        <div className="e-mt-6 e-block md:e-hidden">
                            <Button ui="dashkit" variant="white" className="e-w-full" onClick={retry} asChild>
                                <span>{buttonText}</span>
                            </Button>
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
