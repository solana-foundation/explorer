import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

export function BaseIdlAccounts({ data }: FormattedIdlDataView<'accounts'>) {
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
                {data.map(acc => (
                    <tr key={acc.name}>
                        <td>
                            <HighlightNode className="e-rounded e-py-0.5">{acc.name}</HighlightNode>
                            <BaseIdlDoc docs={acc.docs} />
                        </td>
                        <td>
                            <BaseIdlFields fieldType={acc.fieldType} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
