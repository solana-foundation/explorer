import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlEvents({ data }: FormattedIdlDataView<'events'>) {
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
                {data.map(event => (
                    <tr key={event.name}>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{event.name}</HighlightNode>
                            <BaseIdlDoc docs={event.docs} />
                        </td>
                        <td>
                            <BaseIdlFields fieldType={event.fieldType} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
