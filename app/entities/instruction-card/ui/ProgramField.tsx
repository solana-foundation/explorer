import { Address } from '@components/common/Address';
import { AddressWithContext, programValidator } from '@components/inspector/AddressWithContext';
import { PublicKey } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

type ProgramFieldProps = {
    programId: PublicKey;
    showExtendedInfo?: boolean;
};

export function ProgramField({ programId, showExtendedInfo = false }: ProgramFieldProps) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>Program</BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">
                {showExtendedInfo ? (
                    <AddressWithContext pubkey={programId} validator={programValidator} />
                ) : (
                    <Address pubkey={programId} alignRight link />
                )}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
