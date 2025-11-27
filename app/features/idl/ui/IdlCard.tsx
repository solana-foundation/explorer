'use client';

import { getIdlVersion, useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/utils';
import { useEffect, useMemo, useState } from 'react';

import { IdlSection } from './IdlSection';

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
        const pmpTab: IdlTab = {
            badge: 'Program Metadata IDL',
            id: 'program-metadata',
            idl: programMetadataIdl,
            title: 'Program Metadata',
        };
        const idlTab: IdlTab = {
            badge: 'Anchor IDL',
            id: 'anchor',
            idl: idl,
            title: 'Anchor',
        };

        /// Use PMP's IDL tab as the primary
        const idlTabs: IdlTab[] = [pmpTab];

        // add Anchor's tab only if IDL is present
        if (idl !== null) idlTabs.push(idlTab);

        return idlTabs;
    }, [idl, programMetadataIdl]);

    useEffect(() => {
        // wait until both data are ready and then activate first available in the array
        if (tabs.every(tab => tab.idl !== undefined)) {
            setActiveTabIndex(tabs.findIndex(tab => tab.idl));
        }
    }, [tabs]);

    if ((!idl && !programMetadataIdl) || activeTabIndex === undefined) {
        return null;
    }

    const activeTab = tabs[activeTabIndex];
    return (
        <div className="card">
            <div className="card-header">
                <div className="nav nav-tabs e-border-0" role="tablist">
                    {tabs
                        .filter(tab => tab.idl)
                        .map(tab => (
                            <button
                                key={tab.title}
                                className={cn('nav-item nav-link', {
                                    active: tab.id === activeTab.id,
                                })}
                                onClick={() => setActiveTabIndex(tabs.findIndex(t => t.id === tab.id))}
                            >
                                {tab.title}
                            </button>
                        ))}
                </div>
            </div>
            <div className="card-body">
                <IdlSection
                    badge={
                        <Badge
                            size="xs"
                            variant={getIdlVersion(activeTab.idl) === 'Legacy' ? 'destructive' : 'success'}
                        >
                            {getIdlVersion(activeTab.idl)} {activeTab.badge}
                        </Badge>
                    }
                    idl={activeTab.idl}
                    programId={programId}
                />
            </div>
        </div>
    );
}
