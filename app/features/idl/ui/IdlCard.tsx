'use client';
import { LoadingCard } from '@components/common/LoadingCard';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { getIdlVersion, IdlVariant, isIdlProgramIdMismatch, type SupportedIdl } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'react-feather';

import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { TabsList, TabsTrigger } from '@/app/shared/ui/Tabs';
import { BaseWarningCard } from '@/app/shared/ui/WarningCard';
import { clusterSlug } from '@/app/utils/cluster';

import { useProgramIdls } from '../model/use-program-idls';
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
    const {
        anchorIdl,
        programMetadataIdl,
        preferredVariant,
        isLoading: isAnyIdlLoading,
    } = useProgramIdls(programId, url, cluster);
    const [activeTabIndex, setActiveTabIndex] = useState<number>();
    const [searchStr, setSearchStr] = useState<string>('');

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
        if (anchorIdl) {
            const anchorTab: IdlTab = {
                badge: 'Anchor IDL',
                id: IdlVariant.Anchor,
                idl: anchorIdl,
                title: 'Anchor',
            };
            // If anchor is preferred, put it first
            if (preferredVariant === IdlVariant.Anchor) {
                idlTabs.unshift(anchorTab);
            } else {
                idlTabs.push(anchorTab);
            }
        }

        return idlTabs;
    }, [anchorIdl, programMetadataIdl, preferredVariant]);

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
                    <div className="mb-6 flex items-center gap-2 text-destructive">
                        <AlertTriangle size={16} />
                        <span>
                            This program doesn&apos;t have an IDL yet. If you&apos;re the developer, upload it using the
                            instructions below.
                        </span>
                    </div>

                    <div className="space-y-6">
                        <IdlInstructionSection
                            title="Upload IDL"
                            description="Use this command to upload generated idl in JSON format"
                            commands={['npx @solana-program/program-metadata@latest write idl $PROGRAM_ID ./idl.json']}
                        />

                        <div className="flex items-center justify-between">
                            <span>In case you want to upload IDL with a multisig, follow the documentation.</span>
                            <Button
                                ui="dashkit"
                                variant="outline-primary"
                                size="sm"
                                className="whitespace-nowrap"
                                asChild
                            >
                                <a
                                    href="https://github.com/solana-program/program-metadata?tab=readme-ov-file#commands"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Full documentation
                                    <ExternalLink className="ml-1.5 align-text-top" size={13} />
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
                trigger's -1px bottom margin) overlays the header border. !important so these win
                over dashkit's base classes, since cn() (clsx) keeps all classes and stylesheet order
                would otherwise decide. */}
            <CardHeader ui="dashkit" className="!h-auto">
                <TabsList className="!-mb-3 -mt-3 !border-0">
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
