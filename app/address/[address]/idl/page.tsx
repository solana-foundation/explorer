'use client';

import { IdlCard } from '@components/account/IdlCard';
import { useIdlFromAnchorProgramSeed } from '@providers/anchor';
import { useCluster } from '@providers/cluster';
import { useIdlFromMetadataProgram } from '@providers/idl';
import { Suspense, useEffect, useState } from 'react';

export default function IdlPage({ params: { address } }: { params: { address: string } }) {
    const { url } = useCluster();
    const anchorIdl = useIdlFromAnchorProgramSeed(address, url, false);
    const metadataIdl = useIdlFromMetadataProgram(address, url, false);

    const [activeTab, setActiveTab] = useState<'anchor' | 'metadata'>('anchor');

    useEffect(() => {
        // Show whatever tab is available
        if (!anchorIdl && metadataIdl) {
            setActiveTab('metadata');
        }
    }, [anchorIdl, metadataIdl]);

    return (
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs">
                    {anchorIdl && (
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'anchor' ? 'active' : ''}`}
                                onClick={() => setActiveTab('anchor')}
                            >
                                Anchor IDL
                            </button>
                        </li>
                    )}
                    {metadataIdl && (
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'metadata' ? 'active' : ''}`}
                                onClick={() => setActiveTab('metadata')}
                            >
                                Program Metadata IDL
                            </button>
                        </li>
                    )}
                </ul>
            </div>
            <div className="card-body">
                <Suspense fallback={<div>Loading...</div>}>
                    {activeTab === 'anchor' && anchorIdl && <AnchorIdlCard programId={address} url={url} />}
                    {activeTab === 'metadata' && metadataIdl && (
                        <ProgramMetadataIdlCard url={url} programId={address} />
                    )}
                </Suspense>
            </div>
        </div>
    );
}

function ProgramMetadataIdlCard({ programId, url }: { programId: string; url: string }) {
    const idl = useIdlFromMetadataProgram(programId, url, true);

    return <IdlCard idl={idl ?? ({} as any)} programId={programId} title="Program Metadata IDL" />;
}

function AnchorIdlCard({ programId, url }: { programId: string; url: string }) {
    const idl = useIdlFromAnchorProgramSeed(programId, url, true);

    return <IdlCard idl={idl ?? ({} as any)} programId={programId} title="Anchor IDL" />;
}
