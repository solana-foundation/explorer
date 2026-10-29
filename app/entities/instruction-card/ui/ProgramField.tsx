import { Address } from '@components/common/Address';
import { AddressWithContext, programValidator } from '@components/inspector/AddressWithContext';
import { PublicKey } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

type ProgramFieldProps = {
    programId: PublicKey;
    validateProgram?: boolean;
    /** For a card whose table is wider than two columns, so the row still reaches the right edge. */
    colSpan?: number;
    /** Shows only for a program that has no explorer label, so every card names a known program the same way. */
    name?: string;
};

export function ProgramField({ programId, validateProgram = false, colSpan, name }: ProgramFieldProps) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>Program</BaseTable.Cell>
            <BaseTable.Cell className="text-right" colSpan={colSpan}>
                {validateProgram ? (
                    <AddressWithContext pubkey={programId} validator={programValidator} />
                ) : (
                    <Address pubkey={programId} alignRight link fallbackText={name} />
                )}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
