'use client';
import { LoadingCard } from '@components/common/LoadingCard';
import { AddressLink } from '@components/shared/address';
import { Badge } from '@components/shared/ui/badge';
import { Button, buttonVariants } from '@components/shared/ui/button';
import { ExternalLink } from '@components/shared/ui/external-link';
import {
    buildProgramName,
    getIdlBadgeLabel,
    getIdlProgramVersion,
    IdlVariant,
    isIdlProgramIdMismatch,
    type SupportedIdl,
    useProgramIdls,
} from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { type Address } from '@solana/kit';
import { useState } from 'react';
import { AlertCircle, AlertTriangle, ExternalLink as ExternalLinkIcon } from 'react-feather';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { cn } from '@/app/components/shared/utils';
import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseWarningCard } from '@/app/shared/ui/WarningCard';
import { clusterSlug } from '@/app/utils/cluster';

import { IdlInstructionSection } from './IdlInstructionSection';
import { IdlSection } from './IdlSection';

export function IdlCard({ programId }: { programId: string }) {
    const { url, cluster } = useCluster();
    const network = clusterSlug(cluster);
    const { anchorIdl, anchorIdlAddress, programMetadataIdl, programMetadataIdlAddress, isLoading } = useProgramIdls(
        programId,
        url,
        cluster,
    );
    const [searchStr, setSearchStr] = useState<string>('');

    // Link to the standalone IDL explorer (idl.solana.com) — the full history view across every IDL
    // source for this program; this card surfaces only the single latest IDL.
    const idlHistoryUrl = `https://idl.solana.com/?${new URLSearchParams({
        cluster: network,
        mode: 'history',
        programId,
    }).toString()}`;
    const idlHistoryLink = (
        <ExternalLink
            href={idlHistoryUrl}
            className={cn(buttonVariants({ size: 'sm', ui: 'dashkit', variant: 'white' }), 'whitespace-nowrap')}
        >
            IDL history
            <ExternalLinkIcon className="ml-1.5 align-text-top" size={13} />
        </ExternalLink>
    );

    // Single IDL view: show the program-metadata (PMP) IDL, falling back to the Anchor source only
    // when no PMP IDL exists.
    const idl: SupportedIdl | undefined = programMetadataIdl ?? anchorIdl;
    const isFallback = !programMetadataIdl && Boolean(anchorIdl);

    if (!idl) {
        if (isLoading) {
            return <LoadingCard message="Loading program IDL" />;
        }
        return (
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h4" ui="dashkit">
                        Program IDL
                    </CardTitle>
                    {idlHistoryLink}
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
                                    <ExternalLinkIcon className="ml-1.5 align-text-top" size={13} />
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    const isMismatch = isIdlProgramIdMismatch(idl, programId);
    // Single badge: the IDL standard with its version(s) — `Codama (version 1.5.1)` /
    // `Anchor 0.30.1 (version 0.1.0)` / `Anchor (legacy)`. The program's own semver lives in the info
    // rows below. Dashkit style: the Anchor fallback (no PMP IDL) is "warning" (matching the "Program
    // has no security.txt" badge) with the adjacent info icon; otherwise (any PMP IDL) it's "success".
    const badge = (
        <div className="flex flex-wrap items-center gap-2">
            <Badge ui="dashkit" variant={isFallback ? 'warning' : 'success'}>
                {getIdlBadgeLabel(idl)}
            </Badge>
            {isFallback && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className="inline-flex cursor-help items-center text-[#fa62fc]"
                            aria-label="Fallback IDL source"
                        >
                            <AlertCircle size={14} />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-80">
                        No Program Metadata (PMP) IDL was found, so the Explorer is showing the IDL from the
                        program&apos;s on-chain Anchor IDL account instead.
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );

    // Metadata shown directly under the badge: the storage account the displayed IDL was read from,
    // which source it came from, and the program's own version (distinct from the badge's spec label).
    const idlAddress = isFallback ? anchorIdlAddress : programMetadataIdlAddress;
    const idlSourceLabel = isFallback ? 'Anchor' : 'PMP';
    const programVersion = getIdlProgramVersion(idl);
    // Codama / modern Anchor names only; legacy Anchor top-level name is intentionally not shown.
    const programName = buildProgramName([idl]);
    const info = (
        <dl className="flex flex-col gap-1 text-xs">
            {idlAddress && (
                <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 text-neutral-400">Address</dt>
                    <dd className="flex min-w-0 items-center gap-1.5 text-white">
                        <AddressLink address={idlAddress as Address} truncate={{ head: 4, tail: 4 }} />
                        <span className="text-neutral-500">(PDA)</span>
                    </dd>
                </div>
            )}
            {programName && (
                <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 text-neutral-400">Name</dt>
                    <dd className="text-white">{programName}</dd>
                </div>
            )}
            <div className="flex items-baseline gap-2">
                <dt className="w-32 shrink-0 text-neutral-400">Source</dt>
                <dd className="text-white">{idlSourceLabel}</dd>
            </div>
            {programVersion && (
                <div className="flex items-baseline gap-2">
                    <dt className="w-32 shrink-0 text-neutral-400">Program Version</dt>
                    <dd className="text-white">{programVersion}</dd>
                </div>
            )}
        </dl>
    );

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    Program IDL
                </CardTitle>
                {idlHistoryLink}
            </CardHeader>
            <CardBody ui="dashkit">
                {isMismatch ? (
                    <BaseWarningCard
                        message="IDL Program ID Mismatch"
                        description="The program address in this IDL does not match the program being viewed. The IDL content is hidden to prevent interaction with a potentially fraudulent IDL."
                    />
                ) : (
                    <IdlSection
                        badge={badge}
                        info={info}
                        idl={idl}
                        idlSource={isFallback ? IdlVariant.Anchor : IdlVariant.ProgramMetadata}
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
