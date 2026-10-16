import * as React from 'react';

import { Card } from '@/app/shared/ui/Card';

export type OverviewCardProps = {
    title: React.ReactNode;
    actions?: React.ReactNode;
    note?: React.ReactNode;
    id?: string;
    children: React.ReactNode;
};

export function OverviewCard({ title, actions, note, id, children }: OverviewCardProps) {
    return (
        <section id={id} className="flex flex-col gap-3">
            <div className="flex min-h-[1.75rem] items-center gap-2">
                <h2 className="m-0 flex flex-1 items-center gap-2 text-lg font-normal text-white">{title}</h2>
                {actions}
            </div>
            {note}
            <Card ui="dashkit" marginBottom="none">
                <div className="flex min-w-0 flex-col overflow-x-clip">{children}</div>
            </Card>
        </section>
    );
}
