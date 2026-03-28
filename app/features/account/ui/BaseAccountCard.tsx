import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import React from 'react';
import { Code, RefreshCw } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';

export type BaseAccountCardProps = TableCardBodyProps & {
    title: React.ReactNode;
    rawContent?: React.ReactNode;
    refresh?: () => void;
    showRawButton?: boolean;
};

export function BaseAccountCard({
    title,
    rawContent,
    refresh,
    showRawButton = true,
    children,
    ...tableProps
}: BaseAccountCardProps) {
    const [showRaw, setShowRaw] = React.useState(false);

    return (
        <div className="card">
            <div className="card-header e-gap-2">
                <h3 className="card-header-title mb-0 d-flex align-items-center">{title}</h3>
                {showRawButton && (
                    <Button
                        variant={showRaw ? 'default' : 'outline'}
                        size="sm"
                        aria-label="Raw"
                        className={showRaw ? 'e-shadow-active-sm' : undefined}
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code size={12} />
                        <span className="d-none d-md-inline">Raw</span>
                    </Button>
                )}
                {refresh && (
                    <Button variant="outline" size="sm" aria-label="Refresh" onClick={refresh}>
                        <RefreshCw size={12} />
                        <span className="d-none d-md-inline">Refresh</span>
                    </Button>
                )}
            </div>

            <TableCardBody {...tableProps}>{showRaw ? rawContent : children}</TableCardBody>
        </div>
    );
}
