'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlEventsView({ data }: { data: FormattedIdl['events'] }) {
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
                {data.map(event => (
                    <tr key={event.name}>
                        <td>
                            {event.name}
                            {!!event.docs && <IdlDoc docs={event.docs} />}
                        </td>
                        <td>{!!event.fieldType && <IdlFieldsView fieldType={event.fieldType} />}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
