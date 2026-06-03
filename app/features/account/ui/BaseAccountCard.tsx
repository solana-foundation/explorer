import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import { RefreshButton } from '@shared/ui/refresh-button';
import React from 'react';
import { Code } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { CardHeader } from '@/app/shared/ui/Card';

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
            <CardHeader ui="dashkit" className="e-gap-2">
                <h3 className="card-header-title e-mb-0 e-flex e-items-center">{title}</h3>
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
                        <span className="e-hidden md:e-inline">Raw</span>
                    </Button>
                )}
                {headerActions}
            </CardHeader>

            <TableCardBody {...tableProps}>{showRaw ? rawContent : children}</TableCardBody>
        </div>
    );
}
