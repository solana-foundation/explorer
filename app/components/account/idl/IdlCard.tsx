'use client';

import { useAnchorProgram } from '@providers/anchor';
import { useCluster } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Eye } from 'react-feather';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { useProgramMetadataIdl } from '@/app/entities/program-metadata';
import { getIdlSpecKeyType } from '@/app/utils/convertLegacyIdl';

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
    const [activeTabIndex, setActiveTabIndex] = useState<number>();

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
            setActiveTabIndex(tabs.findIndex(tab => tab.idl));
        }
    }, [tabs]);

    if ((!idl && !programMetadataIdl) || activeTabIndex == undefined) {
        return null;
    }

    const activeTab = tabs[activeTabIndex];
    return (
        <div className="card">
            <div className="card-header">
                <div className="nav nav-tabs" role="tablist">
                    {tabs
                        .filter(tab => tab.idl)
                        .map((tab, i) => (
                            <button
                                key={tab.title}
                                className={classNames('nav-item nav-link', {
                                    active: tab.id === activeTab?.id,
                                })}
                                onClick={() => setActiveTabIndex(i)}
                            >
                                {tab.title}
                            </button>
                        ))}
                </div>
            </div>
            <div className="card-body">
                <IdlSection
                    badge={<IDLBadge title={activeTab.badge} idl={activeTab.idl} />}
                    idl={activeTab.idl}
                    programId={programId}
                />
            </div>
        </div>
    );
}

function IdlSection({ idl, badge, programId }: { idl: any; badge: React.ReactNode; programId: string }) {
    const [collapsedValue, setCollapsedValue] = useState<boolean | number>(1);
    const [isRawIdlView, setIsRawIdlView] = useState<boolean>(false);
    const [searchStr, setSearchStr] = useState<string>('');

    const onSearchIdl = useDebounceCallback((str: string) => {
        setSearchStr(str);
    }, 1000);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center">
                {badge}
                <div className="d-flex align-items-center gap-4">
                    {isRawIdlView ? (
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
                    ) : (
                        <input
                            className="form-control"
                            style={{ height: 30 }}
                            placeholder="Search"
                            onChange={e => onSearchIdl(e.target.value)}
                        />
                    )}
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
                <IdlRenderer
                    idl={idl}
                    collapsed={collapsedValue}
                    raw={isRawIdlView}
                    searchStr={searchStr}
                    programId={programId}
                />
            </div>
        </>
    );
}

function IdlRenderer({
    idl,
    collapsed,
    raw,
    searchStr = '',
    programId,
}: {
    idl: any;
    collapsed: boolean | number;
    raw: boolean;
    searchStr: string;
    programId: string;
}) {
    if (raw) {
        return (
            <ReactJson
                src={idl}
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

    const spec = getIdlSpecKeyType(idl);
    switch (spec) {
        case 'codama':
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering PMP IDL" />}>
                    <CodamaFormattedIdl idl={idl} searchStr={searchStr} />
                </ErrorBoundary>
            );
        default:
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering Anchor IDL" />}>
                    {spec === 'legacy-shank' ? (
                        <div className="my-2">{`Note: Shank IDLs are not fully supported. Unused types may be absent from detailed view.`}</div>
                    ) : null}

                    <AnchorFormattedIdl idl={idl} programId={programId} searchStr={searchStr} />
                </ErrorBoundary>
            );
    }
}

function IdlErrorFallback({ message }: { message: string }) {
    return <center className="pt-5">{message}</center>;
}
