import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'react-feather';

import { DownloadableButton } from '@/app/components/common/Downloadable';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { Button } from '@/app/components/shared/ui/button';
import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { type ResolvedSecurityTxt, useSecurityTxt } from '../model/useSecurityTxt';
import { SecurityTxtVersionBadge } from './common';
import { EmptySecurityTxtCard } from './EmptySecurityTxtCard';
import { NeodymeSecurityTxtTable } from './NeodymeSecurityTxtTable';
import { PmpSecurityTxtTable } from './PmpSecurityTxtTable';
import { securityTxtDataToBase64 } from './utils';

export function SecurityCard({ data, pubkey }: { data: UpgradeableLoaderAccountData; pubkey: PublicKey }) {
    const { securityTxt, isLoading } = useSecurityTxt(pubkey.toBase58());

    if (!data.programData) {
        return <ErrorCard text="Account has no data" />;
    }
    if (isLoading) {
        return null;
    }
    if (!securityTxt) {
        return <EmptySecurityTxtCard programAddress={pubkey.toString()} />;
    }

    return <ProgramSecurityTxtCard programAddress={pubkey.toBase58()} securityTxt={securityTxt} />;
}

// Renders a resolved security.txt: the PMP table for PMP-sourced entries, the Neodyme table for
// ELF-sourced ones.
export function ProgramSecurityTxtCard({
    programAddress,
    securityTxt,
}: {
    programAddress: string;
    securityTxt: ResolvedSecurityTxt;
}) {
    const downloadData = useMemo(() => securityTxtDataToBase64(securityTxt.fields), [securityTxt.fields]);
    const isPmp = securityTxt.type === 'pmp';

    return (
        <Card ui="dashkit" className="overflow-hidden">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="mr-4 flex items-center gap-3">
                    Security.txt
                    <SecurityTxtVersionBadge version={isPmp ? 'pmp' : 'neodyme'} />
                </CardTitle>
                <Button ui="dashkit" variant="white" size="sm" className="flex" asChild>
                    <div>
                        <DownloadableButton
                            data={downloadData}
                            filename={`${programAddress}-security-txt.json`}
                            type="application/json"
                        >
                            Download
                        </DownloadableButton>
                    </div>
                </Button>
            </CardHeader>
            <div className="px-6 py-4">
                <small className="flex gap-1 text-dk-warning-on-dark">
                    <AlertCircle size={16} className="mt-0.5" />
                    Note that this is self-reported by the author of the program and might not be accurate
                </small>
            </div>
            <ErrorBoundary
                fallback={
                    <CardBody ui="dashkit" className="text-center">
                        Invalid security.txt
                    </CardBody>
                }
            >
                {isPmp ? (
                    <PmpSecurityTxtTable data={securityTxt.fields} />
                ) : (
                    <NeodymeSecurityTxtTable data={securityTxt.fields} />
                )}
            </ErrorBoundary>
        </Card>
    );
}
