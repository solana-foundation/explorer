import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
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
            <tbody className="list">
                {data.map(acc => (
                    <tr key={acc.name}>
                        <td>
                            <span className="e-font-mono e-text-xs">{acc.name}</span>
                            <BaseIdlDoc docs={acc.docs} />
                        </td>
                        <td>{!!acc.fieldType && <BaseIdlFields fieldType={acc.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
