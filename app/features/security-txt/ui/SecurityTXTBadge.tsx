import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';

import { Badge } from '@/app/components/shared/ui/badge';
import { CardTitle } from '@/app/shared/ui/Card';

import { NO_SECURITY_TXT_ERROR } from '../lib/constants';
import { useSecurityTxt } from '../model/useSecurityTxt';

export function ProgramSecurityTXTBadge({ programPubkey }: { programPubkey: PublicKey }) {
    const securityTabPath = useClusterPath({ pathname: `/address/${programPubkey.toBase58()}/security` });
    const { securityTxt, isLoading } = useSecurityTxt(programPubkey.toBase58());

    if (isLoading) {
        return <></>;
    }

    const maybeError = securityTxt ? undefined : NO_SECURITY_TXT_ERROR;
    return <SecurityTXTBadge error={maybeError} tabPath={securityTabPath} />;
}

export function SecurityTXTBadge({ error, tabPath }: { error?: string; tabPath: string }) {
    if (error) {
        return (
            <CardTitle as="h3" ui="dashkit">
                <Badge ui="dashkit" variant="warning">
                    {error}
                </Badge>
            </CardTitle>
        );
    }

    return (
        <CardTitle as="h3" ui="dashkit">
            <Badge ui="dashkit" variant="success" className="cursor-pointer" asChild>
                <Link href={tabPath}>Included</Link>
            </Badge>
        </CardTitle>
    );
}
