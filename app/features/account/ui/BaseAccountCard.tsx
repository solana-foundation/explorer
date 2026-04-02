import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import { RefreshButton } from '@shared/ui/refresh-button';
import React from 'react';
import { Code } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';

export type BaseAccountCardProps = TableCardBodyProps & {
    title: React.ReactNode;
    rawContent?: React.ReactNode;
    headerActions?: React.ReactNode;
    refresh?: () => void;
    analyticsSection?: string;
    showRawButton?: boolean;
};

export function BaseAccountCard({
    title,
    rawContent,
    headerActions,
    refresh,
    analyticsSection,
    showRawButton = true,
    children,
    ...tableProps
}: BaseAccountCardProps) {
    const [showRaw, setShowRaw] = React.useState(false);

    return (
        <div className="card">
            <div className="card-header e-gap-2">
                <h3 className="card-header-title mb-0 d-flex align-items-center">{title}</h3>
                {refresh && analyticsSection && <RefreshButton analyticsSection={analyticsSection} onClick={refresh} />}
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
                {headerActions}
            </div>

            <TableCardBody {...tableProps}>{showRaw ? rawContent : children}</TableCardBody>
        </div>
    );
}
