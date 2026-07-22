import { Button } from '@components/shared/ui/button';
import React from 'react';

import { Card, CardBody } from '@/app/shared/ui/Card';

interface BaseTransactionNotFoundCardProps {
    retry?: () => void;
    subtext?: React.ReactNode;
    buttonText?: string;
}

export function BaseTransactionNotFoundCard({
    retry,
    subtext,
    buttonText = 'Try Again',
}: BaseTransactionNotFoundCardProps) {
    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit" className="text-center">
                Not Found
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
                    </>
                )}
                {subtext && (
                    <div className="text-dk-gray-700">
                        <hr />
                        {subtext}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
