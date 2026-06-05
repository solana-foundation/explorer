import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'react-feather';

import { DownloadableButton } from '@/app/components/common/Downloadable';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { useCluster } from '@/app/providers/cluster';
import { CardBody, CardHeader } from '@/app/shared/ui/Card';

import { NO_SECURITY_TXT_ERROR } from '../lib/constants';
import { fromProgramData } from '../lib/fromProgramData';
import type { NeodymeSecurityTXT } from '../lib/types';
import { SecurityTxtVersionBadge } from './common';
import { EmptySecurityTxtCard } from './EmptySecurityTxtCard';
import { NeodymeSecurityTxtTable } from './NeodymeSecurityTxtTable';
import { PmpSecurityTxtTable } from './PmpSecurityTxtTable';
import { securityTxtDataToBase64 } from './utils';

export function SecurityCard({ data, pubkey }: { data: UpgradeableLoaderAccountData; pubkey: PublicKey }) {
    const { url, cluster } = useCluster();
    const { programMetadataSecurityTxt } = useProgramMetadataSecurityTxt(pubkey.toBase58(), url, cluster);

    if (!data.programData) {
        return <ErrorCard text="Account has no data" />;
    }

    const { securityTXT, error } = fromProgramData(data.programData);

    if (!securityTXT && !programMetadataSecurityTxt && error) {
        if (error === NO_SECURITY_TXT_ERROR) {
            return <EmptySecurityTxtCard programAddress={pubkey.toString()} />;
        } else {
            return <ErrorCard text={error} />;
        }
    }
    return (
        <ProgramSecurityTxtCard
            programAddress={pubkey.toBase58()}
            programDataSecurityTxt={securityTXT}
            pmpSecurityTxt={programMetadataSecurityTxt}
        />
    );
}

// Accepts security.txt from Program Data and Program Metadata json
// By default renders security.txt json from Program Metadata
// Fallback to Program Data security.txt
export function ProgramSecurityTxtCard({
    programAddress,
    programDataSecurityTxt,
    pmpSecurityTxt,
}: {
    programAddress: string;
    programDataSecurityTxt: NeodymeSecurityTXT | undefined;
    pmpSecurityTxt: any;
}) {
    const downloadData = useMemo(() => {
        if (!pmpSecurityTxt && !programDataSecurityTxt) return '';
        return securityTxtDataToBase64(pmpSecurityTxt || programDataSecurityTxt);
    }, [programDataSecurityTxt, pmpSecurityTxt]);

    if (!programDataSecurityTxt && !pmpSecurityTxt) {
        return <EmptySecurityTxtCard programAddress={programAddress} />;
    }

    // Determine which table component to render
    const securityTable = pmpSecurityTxt ? (
        <PmpSecurityTxtTable data={pmpSecurityTxt} />
    ) : programDataSecurityTxt ? (
        <NeodymeSecurityTxtTable data={programDataSecurityTxt} />
    ) : null;

    return (
        <div className="card security-txt e-overflow-hidden">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title e-mb-0 e-mr-4 e-flex e-items-center e-gap-3">
                    Security.txt
                    <SecurityTxtVersionBadge version={pmpSecurityTxt ? 'pmp' : 'neodyme'} />
                </h3>
                <div className="btn btn-sm btn-white e-flex">
                    <DownloadableButton
                        data={downloadData}
                        filename={`${programAddress}-security-txt.json`}
                        type="application/json"
                    >
                        Download
                    </DownloadableButton>
                </div>
            </CardHeader>
            <div className="e-px-6 e-py-4">
                <small className="e-flex e-gap-1 e-text-dk-warning-on-dark">
                    <AlertCircle size={16} className="e-mt-0.5" />
                    Note that this is self-reported by the author of the program and might not be accurate
                </small>
            </div>
            <ErrorBoundary
                fallback={
                    <CardBody ui="dashkit" className="e-text-center">
                        Invalid security.txt
                    </CardBody>
                }
            >
                {securityTable}
            </ErrorBoundary>
        </div>
    );
}
