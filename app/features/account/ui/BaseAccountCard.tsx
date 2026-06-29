import { TableCardBody, type TableCardBodyProps } from '@components/common/TableCardBody';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import React from 'react';
import { Code } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

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
        <Card ui="dashkit">
            <CardHeader ui="dashkit" className="gap-2">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    {title}
                </CardTitle>
                {refresh && analyticsSection && <RefreshButton analyticsSection={analyticsSection} onClick={refresh} />}
                {showRawButton && (
                    <Button
                        variant={showRaw ? 'default' : 'outline'}
                        size="sm"
                        aria-label="Raw"
                        className={showRaw ? 'shadow-active-sm' : undefined}
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code size={12} />
                        <span className="hidden md:inline">Raw</span>
                    </Button>
                )}
                {headerActions}
            </CardHeader>

            <TableCardBody {...tableProps}>{showRaw ? rawContent : children}</TableCardBody>
        </Card>
    );
}
