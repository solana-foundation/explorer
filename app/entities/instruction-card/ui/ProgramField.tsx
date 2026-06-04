import { Address } from '@components/common/Address';
import { AddressWithContext, programValidator } from '@components/inspector/AddressWithContext';
import { PublicKey } from '@solana/web3.js';

type ProgramFieldProps = {
    programId: PublicKey;
    showExtendedInfo?: boolean;
};

export function ProgramField({ programId, showExtendedInfo = false }: ProgramFieldProps) {
    return (
        <tr>
            <td>Program</td>
            <td className="e-text-right">
                {showExtendedInfo ? (
                    <AddressWithContext pubkey={programId} validator={programValidator} />
                ) : (
                    <Address pubkey={programId} alignRight link />
                )}
            </td>
        </tr>
    );
}
