'use client';

import { FormattedIdl, InstructionAccountData } from './formatters/FormattedIdl';
import { IdlDoc, IdlDocTooltip } from './IdlDoc';
import { IdlStructFieldsView } from './IdlFields';

type IxData = FormattedIdl['instructions'];
type IxAccountsData = NonNullable<FormattedIdl['instructions']>[0]['accounts'];
type IxArgsData = NonNullable<FormattedIdl['instructions']>[0]['args'];

export function IdlInstructionsView({ data }: { data: IxData }) {
    if (!data) return null;

    return (
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted w-2">Name</th>
                    <th className="text-muted">Arguments</th>
                    <th className="text-muted">Accounts</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(ix => (
                    <tr key={ix.name}>
                        <td>
                            {ix.name}
                            <IdlDoc docs={ix.docs} />
                        </td>
                        <td>
                            <IdlInstructionArguments data={ix.args} />
                        </td>
                        <td>
                            <IdlInstructionAccounts data={ix.accounts} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function IdlInstructionArguments({ data }: { data: IxArgsData }) {
    if (!data.length) return <>&mdash;</>;
    return <IdlStructFieldsView fields={data} />;
}

function IdlInstructionAccounts({ data }: { data: IxAccountsData }) {
    return (
        <div className="d-flex gap-1 flex-column align-items-start justify-start flex-wrap">
            {data.map(acc => {
                // nested accs
                if ('accounts' in acc) {
                    return (
                        <div key={acc.name}>
                            <p className="text-muted mb-2">{acc.name}</p>
                            <div className="px-3 py-2 e-bg-neutral-800">
                                <InstructionAccounts accounts={acc.accounts} />
                            </div>
                        </div>
                    );
                }
                return (
                    <IdlInstructionAccount
                        key={acc.name}
                        docs={acc.docs}
                        name={acc.name}
                        isWritable={acc.writable}
                        isSigner={acc.signer}
                        isPda={acc.pda}
                        isOptional={acc.optional}
                    />
                );
            })}
        </div>
    );
}

function InstructionAccounts({ accounts }: { accounts: InstructionAccountData[] }) {
    return (
        <div className="d-flex gap-1 flex-column align-items-start justify-start flex-wrap">
            {accounts.map(({ docs, name, writable, signer, pda, optional }) => (
                <IdlInstructionAccount
                    key={name}
                    docs={docs}
                    name={name}
                    isWritable={writable}
                    isSigner={signer}
                    isPda={pda}
                    isOptional={optional}
                />
            ))}
        </div>
    );
}

function IdlInstructionAccount({
    docs,
    name,
    isWritable,
    isSigner,
    isPda,
    isOptional,
}: {
    docs: string[];
    name: string;
    isWritable?: boolean;
    isSigner?: boolean;
    isPda?: boolean;
    isOptional?: boolean;
}) {
    return (
        <IdlDocTooltip key={name} docs={docs}>
            <div className="d-inline-flex align-items-center gap-2">
                <span>{name}</span>
                {!!isWritable && <span className="badge bg-info-soft">isMut</span>}
                {!!isSigner && <span className="badge bg-warning-soft">isSigner</span>}
                {!!isPda && <span className="badge bg-light-soft">pda</span>}
                {!!isOptional && <span className="badge bg-secondary-soft">optional</span>}
            </div>
        </IdlDocTooltip>
    );
}
