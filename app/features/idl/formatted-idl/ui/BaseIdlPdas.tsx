import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import type { FormattedIdlDataView } from './types';

export function BaseIdlPdas({ data }: FormattedIdlDataView<'pdas'>) {
    if (!data) return null;
    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="e-text-neutral-500">Name</th>
                    <th className="e-text-neutral-500">Seeds</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(pda => (
                    <tr key={pda.name}>
                        <td>
                            <span className="e-font-mono e-text-xs">{pda.name}</span>
                            <BaseIdlDoc docs={pda.docs} />
                        </td>
                        <td>
                            <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-2">
                                {pda.seeds.map((seed, i) => (
                                    <div key={i} className="e-flex">
                                        <BaseIdlFields fieldType={seed} />
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
