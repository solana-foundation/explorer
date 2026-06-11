import { ParsedMessage, ParsedMessageAccount, PublicKey } from '@solana/web3.js';

type Props = {
    account: ParsedMessageAccount;
    index: number;
    pubkey: PublicKey;
    message: ParsedMessage;
};

export function AccountBadges({ account, index, pubkey, message }: Props) {
    return (
        <>
            {index === 0 && <span className="badge bg-success-soft me-1">Fee Payer</span>}
            {account.signer && <span className="badge bg-info-soft me-1">Signer</span>}
            {account.writable && <span className="badge bg-danger-soft me-1">Writable</span>}
            {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
                <span className="badge bg-warning-soft me-1">Program</span>
            )}
            {account.source === 'lookupTable' && <span className="badge bg-gray-soft me-1">Address Table Lookup</span>}
        </>
    );
}
