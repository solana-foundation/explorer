'use client';
import { getIdlVersion, type SupportedIdl, useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/utils';
import { useEffect, useMemo, useState } from 'react';

import { IdlVariant, useIdlLastTransactionDate } from '../model/use-idl-last-transaction-date';
import { IdlSection } from './IdlSection';

type IdlTab = {
    id: IdlVariant;
    idl: SupportedIdl;
    title: string;
    badge: string;
};

export function IdlCard({ programId }: { programId: string }) {
    const { url, cluster } = useCluster();
    const { idl } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId, url, cluster);
    const [activeTabIndex, setActiveTabIndex] = useState<number>();
    const [searchStr, setSearchStr] = useState<string>('');

    const preferredIdlVariant = useIdlLastTransactionDate(programId, Boolean(idl), Boolean(programMetadataIdl));

    const tabs = useMemo<IdlTab[]>(() => {
        const idlTabs: IdlTab[] = [];

        // Add pmpTab first (default)
        if (programMetadataIdl) {
            idlTabs.push({
                badge: 'Program Metadata IDL',
                id: IdlVariant.ProgramMetadata,
                idl: programMetadataIdl,
                title: 'Program Metadata',
            });
        }

        // Optionally add anchor tab
        if (idl) {
            const anchorTab: IdlTab = {
                badge: 'Anchor IDL',
                id: IdlVariant.Anchor,
                idl: idl,
                title: 'Anchor',
            };
            // If anchor is preferred, put it first
            if (preferredIdlVariant === IdlVariant.Anchor) {
                idlTabs.unshift(anchorTab);
            } else {
                idlTabs.push(anchorTab);
            }
        }

        return idlTabs;
    }, [idl, programMetadataIdl, preferredIdlVariant]);

    useEffect(() => {
        // Activate first tab when tabs are available
        if (tabs.length > 0 && activeTabIndex === undefined) {
            setActiveTabIndex(0);
        }
    }, [tabs, activeTabIndex]);

    if (tabs.length === 0 || activeTabIndex === undefined) {
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
                                    active: tab.id === activeTab?.id,
                                })}
                                onClick={() => {
                                    setActiveTabIndex(tabs.findIndex(t => t.id === tab.id));
                                    setSearchStr('');
                                }}
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
                    searchStr={searchStr}
                    onSearchChange={setSearchStr}
                />
            </div>
        </div>
    );
}
