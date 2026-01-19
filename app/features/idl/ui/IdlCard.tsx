'use client';
import { getIdlVersion, type SupportedIdl, useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/utils';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'react-feather';

import { IdlVariant, useIdlLastTransactionDate } from '../model/use-idl-last-transaction-date';
import { IdlInstructionSection } from './IdlInstructionSection';
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
        return (
            <div className="card">
                <div className="card-header">
                    <h4 className="card-header-title">Program IDL</h4>
                </div>
                <div className="card-body">
                    <div className="e-mb-6 e-flex e-items-center e-gap-2 e-text-destructive">
                        <AlertTriangle size={16} />
                        <span>
                            This program doesn&apos;t have an IDL yet. If you&apos;re the developer, upload it using the
                            instructions below.
                        </span>
                    </div>

                    <div className="e-space-y-6">
                        <IdlInstructionSection
                            title="Create & manage IDL buffer"
                            description="First create a buffer from an IDL JSON file and then transfer authority of that buffer to a new Solana wallet/account."
                            commands={[
                                'npx @solana-program/program-metadata@latest create-buffer ./target/idl/$PROGRAM_NAME.json',
                                `npx @solana-program/program-metadata@latest set-buffer-authority $BUFFER_ACCOUNT \\
  --new-authority $NEW_AUTHORITY_WALLET`,
                            ]}
                        />

                        <IdlInstructionSection
                            title="Create (or updates if it already exists) on-chain IDL"
                            description="This command uses the buffer to either create or update the IDL (Interface Definition Language) on-chain for a specific Solana program. Add --export flag to just see the result."
                            commands={[
                                `npx @solana-program/program-metadata@latest write idl $PROGRAM_ADDRESS \\
  --buffer $BUFFER_ACCOUNT \\
  --close-buffer $NEW_AUTHORITY_WALLET`,
                            ]}
                        />

                        <a
                            href="https://github.com/solana-program/program-metadata?tab=readme-ov-file#commands"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                        >
                            Full documentation
                            <ExternalLink className="align-text-top ms-2" size={13} />
                        </a>
                    </div>
                </div>
            </div>
        );
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
