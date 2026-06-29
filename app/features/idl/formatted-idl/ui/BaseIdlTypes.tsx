import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlTypes({ data }: FormattedIdlDataView<'types'>) {
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
                {data.map(typeItem => (
                    <BaseTable.Row key={typeItem.name}>
                        <BaseTable.Cell>
                            <span className="flex items-center gap-2">
                                <i className="text-neutral-500">{typeItem.fieldType?.kind}</i>
                                <HighlightNode className="rounded">{typeItem.name}</HighlightNode>
                            </span>
                            <BaseIdlDoc docs={typeItem.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <BaseIdlFields fieldType={typeItem.fieldType} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
