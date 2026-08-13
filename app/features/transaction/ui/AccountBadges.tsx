import { Badge } from '@components/shared/ui/badge';
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
            {index === 0 && (
                <Badge ui="dashkit" variant="success">
                    Fee Payer
                </Badge>
            )}
            {account.signer && (
                <Badge ui="dashkit" variant="info">
                    Signer
                </Badge>
            )}
            {account.writable && (
                <Badge ui="dashkit" variant="danger">
                    Writable
                </Badge>
            )}
            {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
                <Badge ui="dashkit" variant="warning">
                    Program
                </Badge>
            )}
            {account.source === 'lookupTable' && (
                <Badge ui="dashkit" variant="gray">
                    Address Table Lookup
                </Badge>
            )}
        </>
    );
}
