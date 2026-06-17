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
            <CardBody ui="dashkit" className="text-center">
                {text}
                {retry && (
                    <>
                        <Button ui="dashkit" variant="white" className="ml-3 hidden md:inline" onClick={retry} asChild>
                            <span>{buttonText}</span>
                        </Button>
                        <div className="mt-6 block md:hidden">
                            <Button ui="dashkit" variant="white" className="w-full" onClick={retry} asChild>
                                <span>{buttonText}</span>
                            </Button>
                        </div>
                        {subtext && (
                            <div className="text-dk-gray-700">
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
