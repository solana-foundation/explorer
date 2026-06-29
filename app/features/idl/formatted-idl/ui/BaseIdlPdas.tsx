import { BaseTable } from '@/app/shared/ui/Table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlPdas({ data }: FormattedIdlDataView<'pdas'>) {
    if (!data) return null;
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell className="text-neutral-500">Name</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell className="text-neutral-500">Seeds</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body className="font-mono text-xs">
                {data.map(pda => (
                    <BaseTable.Row key={pda.name}>
                        <BaseTable.Cell>
                            <HighlightNode className="rounded py-0.5">{pda.name}</HighlightNode>
                            <BaseIdlDoc docs={pda.docs} />
                        </BaseTable.Cell>
                        <BaseTable.Cell>
                            <div className="flex flex-col flex-wrap items-start justify-start gap-2">
                                {pda.seeds.map((seed, i) => (
                                    <div key={i} className="flex">
                                        <BaseIdlFields fieldType={seed} />
                                    </div>
                                ))}
                            </div>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
