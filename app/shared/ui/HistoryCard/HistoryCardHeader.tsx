import { RefreshButton } from '@components/shared/ui/refresh-button';

import { CardHeader, CardTitle } from '@/app/shared/ui/Card';

export type HistoryCardHeaderProps = {
    title: string;
    analyticsSection: string;
    refresh: () => void;
    fetching: boolean;
};

export function HistoryCardHeader({ title, analyticsSection, refresh, fetching }: HistoryCardHeaderProps) {
    return (
        <CardHeader ui="dashkit">
            <CardTitle as="h3" ui="dashkit">
                {title}
            </CardTitle>
            <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
        </CardHeader>
    );
}
