import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ProgramMetadataProgramName } from '@/app/entities/program-metadata';

import { AnchorProgramName } from './anchor';
import { Cluster } from './cluster';
import { programLabel } from './tx';

export function ProgramName({ programId, cluster, url }: { programId: PublicKey; cluster: Cluster; url: string }) {
    const defaultProgramName = programLabel(programId.toBase58(), cluster);
    if (defaultProgramName) {
        return <>{defaultProgramName}</>;
    }
    return (
        <React.Suspense fallback={<>{defaultProgramName}</>}>
            <ErrorBoundary
                fallback={
                    <AnchorProgramName
                        programId={programId}
                        url={url}
                        cluster={cluster}
                        defaultName={defaultProgramName}
                    />
                }
            >
                <ProgramMetadataProgramName programId={programId} url={url} cluster={cluster} />
            </ErrorBoundary>
        </React.Suspense>
    );
}
