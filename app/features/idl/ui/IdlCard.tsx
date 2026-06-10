'use client';
import { LoadingCard } from '@components/common/LoadingCard';
import { getIdlVersion, isIdlProgramIdMismatch, type SupportedIdl, useAnchorProgram } from '@entities/idl';
import { useProgramMetadataCodamaIdl, useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'react-feather';

import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { TabsList, TabsTrigger } from '@/app/shared/ui/Tabs';
import { BaseWarningCard } from '@/app/shared/ui/WarningCard';
import { clusterSlug } from '@/app/utils/cluster';

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
    const network = clusterSlug(cluster);
    const { idl, isLoading: isAnchorIdlLoading } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl, isLoading: isProgramMetadataIdlLoading } = useProgramMetadataIdl(
        programId,
        url,
        cluster,
    );
    const { codamaIdl, isLoading: isCodamaIdlLoading } = useProgramMetadataCodamaIdl(programId, url, cluster);
    const isAnyIdlLoading = isAnchorIdlLoading || isProgramMetadataIdlLoading || isCodamaIdlLoading;
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

        // Optionally add codama tab
        if (codamaIdl) {
            idlTabs.push({
                badge: 'Codama IDL',
                id: IdlVariant.Codama,
                idl: codamaIdl,
                title: 'Codama',
            });
        }

        return idlTabs;
    }, [idl, programMetadataIdl, codamaIdl, preferredIdlVariant]);

    useEffect(() => {
        // Activate first tab when tabs are available
        if (tabs.length > 0 && activeTabIndex === undefined) {
            setActiveTabIndex(0);
        }
    }, [tabs, activeTabIndex]);

    if (tabs.length === 0 || activeTabIndex === undefined) {
        if (isAnyIdlLoading || tabs.length > 0) {
            return <LoadingCard message="Loading program IDL" />;
        }
        return (
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h4" ui="dashkit">
                        Program IDL
                    </CardTitle>
                </CardHeader>
                <CardBody ui="dashkit">
                    <div className="e-mb-6 e-flex e-items-center e-gap-2 e-text-destructive">
                        <AlertTriangle size={16} />
                        <span>
                            This program doesn&apos;t have an IDL yet. If you&apos;re the developer, upload it using the
                            instructions below.
                        </span>
                    </div>

                    <div className="e-space-y-6">
                        <IdlInstructionSection
                            title="Upload IDL"
                            description="Use this command to upload generated idl in JSON format"
                            commands={['npx @solana-program/program-metadata@latest write idl $PROGRAM_ID ./idl.json']}
                        />

                        <div className="e-flex e-items-center e-justify-between">
                            <span>In case you want to upload IDL with a multisig, follow the documentation.</span>
                            <Button
                                ui="dashkit"
                                variant="outline-primary"
                                size="sm"
                                className="e-whitespace-nowrap"
                                asChild
                            >
                                <a
                                    href="https://github.com/solana-program/program-metadata?tab=readme-ov-file#commands"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Full documentation
                                    <ExternalLink className="e-ml-1.5 e-align-text-top" size={13} />
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    const activeTab = tabs[activeTabIndex];
    const isMismatch = isIdlProgramIdMismatch(activeTab.idl, programId);

    return (
        <Card ui="dashkit">
            {/* dashkit .card-header-tabs: header height comes from the tabs (not the fixed 60px),
                negative tab margins cancel the header padding so the active underline (via the
                trigger's -1px bottom margin) overlays the header border. !important because cn()'s
                twMerge is not e-prefix-aware and can't drop conflicting base classes. */}
            <CardHeader ui="dashkit" className="!e-h-auto">
                <TabsList className="!e-border-0 -e-mt-3 !-e-mb-3">
                    {tabs
                        .filter(tab => tab.idl)
                        .map(tab => (
                            <TabsTrigger
                                key={tab.title}
                                active={tab.id === activeTab?.id}
                                onClick={() => {
                                    setActiveTabIndex(tabs.findIndex(t => t.id === tab.id));
                                    setSearchStr('');
                                }}
                            >
                                {tab.title}
                            </TabsTrigger>
                        ))}
                </TabsList>
            </CardHeader>
            <CardBody ui="dashkit">
                {isMismatch ? (
                    <BaseWarningCard
                        message="IDL Program ID Mismatch"
                        description="The program address in this IDL does not match the program being viewed. The IDL content is hidden to prevent interaction with a potentially fraudulent IDL."
                    />
                ) : (
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
                        idlSource={activeTab.id}
                        network={network}
                        programId={programId}
                        searchStr={searchStr}
                        onSearchChange={setSearchStr}
                    />
                )}
            </CardBody>
        </Card>
    );
}
