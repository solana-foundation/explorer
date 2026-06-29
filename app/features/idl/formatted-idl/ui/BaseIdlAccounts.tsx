import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlAccounts({ data }: FormattedIdlDataView<'accounts'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="text-neutral-500">Fields</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="font-mono text-xs">
                {data.map(acc => (
                    <BaseTable.Row key={acc.name}>
                        <BaseTable.Cell>
                            <HighlightNode className="rounded py-0.5">{acc.name}</HighlightNode>
                            <BaseIdlDoc docs={acc.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <BaseIdlFields fieldType={acc.fieldType} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
