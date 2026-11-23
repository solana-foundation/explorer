import { Badge } from '@components/shared/ui/badge';
import type { FormattedIdl, InstructionAccountData } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc, IdlDocTooltip } from './BaseIdlDoc';
import { BaseIdlStructFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type InstructionRow = NonNullable<FormattedIdl['instructions']>[number];
type IxAccountsData = InstructionRow['accounts'];
type IxArgsData = InstructionRow['args'];

const COLUMNS: ReadonlyArray<GridTableColumn<InstructionRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: ix => (
            <div>
                <HighlightNode className="rounded py-0.5">{ix.name}</HighlightNode>
                <BaseIdlDoc docs={ix.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Arguments</span>,
        render: ix => <IdlInstructionArguments data={ix.args} />,
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Accounts</span>,
        render: ix => <IdlInstructionAccounts data={ix.accounts} />,
    },
];

export function BaseIdlInstructions({ data }: FormattedIdlDataView<'instructions'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL instructions"
            gridTemplate="grid-cols-[auto_1fr_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={ix => ix.name}
            empty={null}
            mobile="stack"
        />
    );
}

function IdlInstructionArguments({ data }: { data: IxArgsData }) {
    if (!data.length) return <>&mdash;</>;
    return <BaseIdlStructFields fields={data} />;
}

function IdlInstructionAccounts({ data }: { data: IxAccountsData }) {
    return (
        <div className="flex flex-col flex-wrap items-start justify-start gap-1">
            {data.map(acc => {
                if ('accounts' in acc) {
                    return (
                        <div key={acc.name}>
                            <HighlightNode className="font-mono text-xs">{acc.name}</HighlightNode>
                            <div className="bg-neutral-800 px-3 py-2">
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
        <div className="flex flex-col flex-wrap items-start justify-start gap-1">
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
            <div>
                <HighlightNode className="rounded">
                    <div className="inline-flex items-center gap-2">
                        {name}
                        <div className="flex gap-1">
                            {isWritable && (
                                <Badge variant="warning" size="xs">
                                    Mutable
                                </Badge>
                            )}
                            {isSigner && (
                                <Badge variant="warning" size="xs">
                                    Signer
                                </Badge>
                            )}
                            {isPda && (
                                <Badge variant="info" size="xs">
                                    PDA
                                </Badge>
                            )}
                            {isOptional && (
                                <Badge variant="secondary" size="xs">
                                    Optional
                                </Badge>
                            )}
                        </div>
                    </div>
                </HighlightNode>
            </div>
        </IdlDocTooltip>
    );
}
