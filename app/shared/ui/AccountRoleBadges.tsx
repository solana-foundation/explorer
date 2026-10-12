import { Badge } from '@components/shared/ui/badge';

export function AccountRoleBadges({ isWritable, isSigner }: { isWritable: boolean; isSigner: boolean }) {
    return (
        <>
            {isWritable && (
                <Badge ui="dashkit" variant="destructive" className="mr-[3px]">
                    Writable
                </Badge>
            )}
            {isSigner && (
                <Badge ui="dashkit" variant="info" className="mr-[3px]">
                    Signer
                </Badge>
            )}
        </>
    );
}
