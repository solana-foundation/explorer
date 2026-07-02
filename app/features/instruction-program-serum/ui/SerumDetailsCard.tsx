import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import {
    type DecodedSerumInstruction,
    decodeSerumInstruction,
    getSerumInstructionLabel,
    OPENBOOK_DEX_PROGRAM_LABEL,
} from '@explorer/decoder-serum';
import { useCluster } from '@providers/cluster';
import { type PublicKey, type SignatureResult, type TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

const isUpperCase = (letter: string): boolean => letter !== letter.toLowerCase();
// e.g. `openOrdersOwner` → "Open Orders Owner"
const fieldLabel = (field: string): string => {
    const spaced = [...field].map(letter => (isUpperCase(letter) ? ` ${letter}` : letter)).join('');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">{children}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function AccountRows({ accounts }: { accounts: Record<string, PublicKey | PublicKey[] | undefined> }) {
    return (
        <>
            {Object.entries(accounts)
                .filter((entry): entry is [string, PublicKey | PublicKey[]] => entry[1] !== undefined)
                .map(([field, value]) => (
                    <FieldRow key={field} label={fieldLabel(field)}>
                        {(Array.isArray(value) ? value : [value]).map((pubkey, i) => (
                            <Address key={i} pubkey={pubkey} alignRight link />
                        ))}
                    </FieldRow>
                ))}
        </>
    );
}

function DataRows({ data }: { data: Record<string, string | number | bigint> }) {
    return (
        <>
            {Object.entries(data).map(([field, value]) => (
                <FieldRow key={field} label={fieldLabel(field)}>
                    {field === 'side' ? String(value).toUpperCase() : String(value)}
                </FieldRow>
            ))}
        </>
    );
}

export function SerumDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, signature, innerCards, childIndex } = props;
    const { url } = useCluster();

    let decoded: DecodedSerumInstruction | undefined;
    try {
        decoded = decodeSerumInstruction(ix);
    } catch (error) {
        Logger.error(error, { index, sentry: true, signature, url });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${OPENBOOK_DEX_PROGRAM_LABEL} Program: ${getSerumInstructionLabel(ix)}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw={decoded === undefined}
        >
            {decoded && (
                <>
                    <FieldRow label="Program">
                        <Address pubkey={decoded.info.programId} alignRight link />
                    </FieldRow>
                    <AccountRows accounts={decoded.info.accounts} />
                    {'data' in decoded.info && <DataRows data={decoded.info.data} />}
                </>
            )}
        </InstructionCard>
    );
}
