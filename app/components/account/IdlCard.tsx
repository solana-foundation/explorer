'use client';

import { useAnchorProgram } from '@providers/anchor';
import { useCluster } from '@providers/cluster';
import { useState } from 'react';
import ReactJson from 'react-json-view';

import { useProgramMetadataIdl } from '@/app/providers/useProgramMetadataIdl';

import { DownloadableButton } from '../common/Downloadable';
import { IDLBadge } from '../common/IDLBadge';

export function IdlCard({ programId }: { programId: string }) {
    const { url, cluster } = useCluster();
    const { idl } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId, url, cluster);

    if (!idl && !programMetadataIdl) {
        return null;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="align-items-center">
                    <h3 className="card-header-title">IDL</h3>
                </div>
            </div>
            {!!programMetadataIdl && (
                <IdlSection
                    badge={<IDLBadge title="Codama IDL" idl={programMetadataIdl} />}
                    idl={programMetadataIdl}
                    programId={programId}
                />
            )}
            {!!idl && (
                <IdlSection
                    badge={<IDLBadge title="Anchor IDL" idl={idl} />}
                    idl={idl}
                    programId={programId}
                />
            )}
        </div>
    );
}


function IdlSection({ idl, badge, programId }: { idl: any, badge: React.ReactNode, programId: string }) {
    const [collapsedValue, setCollapsedValue] = useState<boolean | number>(1);
    return (
        <>
            <div className="card-body d-flex justify-content-between align-items-center">
                {badge}
                <div className="d-flex align-items-center gap-4">
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="expandToggle"
                            onChange={e => setCollapsedValue(e.target.checked ? false : 1)}
                        />
                        <label className="form-check-label" htmlFor="expandToggle">
                            Expand All
                        </label>
                    </div>
                    <div className="col-auto btn btn-sm btn-primary d-flex align-items-center">
                        <DownloadableButton
                            data={Buffer.from(JSON.stringify(idl, null, 2)).toString('base64')}
                            filename={`${programId}-idl.json`}
                            type="application/json"
                        >
                            Download
                        </DownloadableButton>
                    </div>
                </div>
            </div>

            <div className="card metadata-json-viewer m-4 mt-2">
                <IdlJson idl={idl} collapsed={collapsedValue} />
            </div>
        </>
    );
}

function IdlJson({ idl, collapsed }: { idl: any, collapsed: boolean | number }) {
    return (
        <ReactJson
            src={idl}
            theme={'solarized'}
            style={{ padding: 25 }}
            name={null}
            enableClipboard={true}
            collapsed={collapsed}
            displayObjectSize={false}
            displayDataTypes={false}
            displayArrayKey={false}
        />
    );
}
