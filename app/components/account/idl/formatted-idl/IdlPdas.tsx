'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlPdasView({ data }: { data: FormattedIdl['pdas'] }) {
    if (!data) return null;

    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted w-2">Name</th>
                    <th className="text-muted">Seeds</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(pda => (
                    <tr key={pda.name}>
                        <td>
                            {pda.name}
                            <IdlDoc docs={pda.docs} />
                        </td>
                        <td>
                            <div className="d-flex gap-2 flex-column items-center flex-wrap">
                                {pda.seeds.map((seed, i) => (
                                    <div key={i} className="d-flex">
                                        {/*<IdlDocTooltip docs={seed.docs}>*/}
                                        <IdlFieldsView fieldType={seed} />
                                        {/*</IdlDocTooltip>*/}
                                    </div>
                                ))}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
