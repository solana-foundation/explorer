'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlTypesView({ data }: { data: FormattedIdl['types'] }) {
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
                {data.map(typeItem => (
                    <tr key={typeItem.name}>
                        <td>
                            <span className="d-flex align-items-center gap-2">
                                <i className="text-muted">{typeItem.fieldType?.kind}</i>
                                {typeItem.name}
                            </span>
                            <IdlDoc docs={typeItem.docs} />
                        </td>
                        <td>{!!typeItem.fieldType && <IdlFieldsView fieldType={typeItem.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
