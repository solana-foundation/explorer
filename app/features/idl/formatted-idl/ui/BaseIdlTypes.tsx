import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlTypes({ data }: FormattedIdlDataView<'types'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Fields</th>
                </tr>
            </thead>
            <tbody className="list e-font-mono e-text-xs">
                {data.map(typeItem => (
                    <tr key={typeItem.name}>
                        <td>
                            <span className="e-flex e-items-center e-gap-2">
                                <i className="e-text-neutral-500">{typeItem.fieldType?.kind}</i>
                                <HighlightNode className="e-rounded">{typeItem.name}</HighlightNode>
                            </span>
                            <BaseIdlDoc docs={typeItem.docs} />
                        </td>
                        <td>
                            <BaseIdlFields fieldType={typeItem.fieldType} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
