import { RefreshButton } from '@components/shared/ui/refresh-button';
import { type ReactNode } from 'react';

import { CardHeader, CardTitle } from '@/app/shared/ui/Card';

export type HistoryCardHeaderProps = {
    title: string;
    analyticsSection: string;
    refresh: () => void;
    fetching: boolean;
    actions?: ReactNode;
    subHeader?: ReactNode;
};

export function HistoryCardHeader({
    title,
    analyticsSection,
    refresh,
    fetching,
    actions,
    subHeader,
}: HistoryCardHeaderProps) {
    return (
        <CardHeader ui="dashkit" className={subHeader ? 'h-auto flex-col items-stretch gap-2 py-3' : ''}>
            <div className="flex flex-1 items-center gap-2">
                <CardTitle as="h3" ui="dashkit" className="flex-1">
                    {title}
                </CardTitle>
                {actions}
                <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
            </div>
            {subHeader && <div className="flex flex-wrap gap-2">{subHeader}</div>}
        </CardHeader>
    );
}
