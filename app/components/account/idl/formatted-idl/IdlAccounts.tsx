'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlAccountsView({ data }: { data: FormattedIdl['accounts'] }) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted w-2">Name</th>
                    <th className="text-muted">Fields</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(acc => (
                    <tr key={acc.name}>
                        <td>
                            {acc.name}
                            <IdlDoc docs={acc.docs} />
                        </td>
                        <td>{!!acc.fieldType && <IdlFieldsView fieldType={acc.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
