'use client';

import { useAnchorProgram } from '@providers/anchor';
import { useCluster } from '@providers/cluster';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Eye } from 'react-feather';
import ReactJson from 'react-json-view';

import { useProgramMetadataIdl } from '@/app/providers/useProgramMetadataIdl';
import { getIdlSpecType } from '@/app/utils/convertLegacyIdl';

import { DownloadableButton } from '../../common/Downloadable';
import { IDLBadge } from '../../common/IDLBadge';
import { AnchorFormattedIdl, CodamaFormattedIdl } from './formatted-idl/IdlView';

type IdlVariant = 'program-metadata' | 'anchor';
type IdlTab = {
    id: IdlVariant;
    idl: any;
    title: string;
    badge: string;
};

export function IdlCard({ programId }: { programId: string }) {
    const { url, cluster } = useCluster();
    const { idl } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId, url, cluster);
    const [activeTab, setActiveTab] = useState<IdlTab>();

    const tabs = useMemo<IdlTab[]>(() => {
        return [
            {
                badge: 'Program Metadata IDL',
                id: 'program-metadata',
                idl: programMetadataIdl,
                title: 'Program Metadata',
            },
            {
                badge: 'Anchor IDL',
                id: 'anchor',
                idl: idl,
                title: 'Anchor',
            },
        ];
    }, [idl, programMetadataIdl]);

    useEffect(() => {
        // wait until both data are ready and then activate first available in the array
        if (tabs.every(tab => tab.idl !== undefined)) {
            setActiveTab(tabs.find(tab => tab.idl));
        }
    }, [tabs]);

    if (!idl && !programMetadataIdl) {
        return null;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="nav nav-tabs" role="tablist">
                    {tabs
                        .filter(tab => tab.idl)
                        .map(tab => (
                            <button
                                key={tab.title}
                                className={classNames('nav-item nav-link', {
                                    active: tab.id === activeTab?.id,
                                })}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.title}
                            </button>
                        ))}
                </div>
            </div>
            <div className="card-body">
                {Boolean(activeTab) && (
                    <IdlSection
                        badge={<IDLBadge title={activeTab!.badge} idl={activeTab!.idl} />}
                        idl={activeTab!.idl}
                        programId={programId}
                    />
                )}
            </div>
        </div>
    );
}

function IdlSection({ idl, badge, programId }: { idl: any; badge: React.ReactNode; programId: string }) {
    const [collapsedValue, setCollapsedValue] = useState<boolean | number>(1);
    const [isRawIdlView, setIsRawIdlView] = useState<boolean>(true);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center">
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
                    <div className="col-auto d-flex align-items-center gap-2">
                        <div className="d-flex btn btn-sm btn-primary">
                            <DownloadableButton
                                data={Buffer.from(JSON.stringify(idl, null, 2)).toString('base64')}
                                filename={`${programId}-idl.json`}
                                type="application/json"
                            >
                                Download
                            </DownloadableButton>
                        </div>
                        <button
                            className="d-flex btn btn-sm btn-primary align-items-center"
                            onClick={() => setIsRawIdlView(!isRawIdlView)}
                        >
                            <Eye className="me-2" size={15} />
                            {isRawIdlView ? 'Details' : 'Raw'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 e-min-h-[200px]">
                <IdlRenderer idl={idl} collapsed={collapsedValue} raw={isRawIdlView} programId={programId} />
            </div>
        </>
    );
}

function IdlRenderer({
    idl,
    collapsed,
    raw,
    programId,
}: {
    idl: any;
    collapsed: boolean | number;
    raw: boolean;
    programId: string;
}) {
    if (raw) {
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

    switch (getIdlSpecType(idl)) {
        case 'codama':
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering PMP IDL" />}>
                    <CodamaFormattedIdl idl={idl} />
                </ErrorBoundary>
            );
        default:
            <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering Anchor IDL" />}>
                <AnchorFormattedIdl idl={idl} programId={programId} />;
            </ErrorBoundary>;
    }
}

function IdlErrorFallback({ message }: { message: string }) {
    return <center className="pt-5">{message}</center>;
}
