'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { TableCardBodyHeaded } from '@components/common/TableCardBody';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import React, { Fragment, useState } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { useCluster } from '@/app/providers/cluster';
import { Alert } from '@/app/shared/ui/Alert';
import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { ExpandInfoButton } from '@/app/shared/ui/ExpandInfoButton';
import { BaseTable } from '@/app/shared/ui/Table';
import {
    dedupeAndSortBuilds,
    hashProgramBuffer,
    type OsecBuild,
    supportsVerifiedBuilds,
    useResolveBuildsByHash,
} from '@/app/utils/verified-builds';
import {
    composeOnchainRepoUrl,
    repoLabel,
    trimTrailingSlashes,
    VERIFIED_BUILDS_GUIDE_URL,
} from '@/app/utils/verified-builds-url';
import { ProgramBufferAccountInfo } from '@/app/validators/accounts/upgradeable-program';

import { Address } from '../common/Address';
import { Copyable } from '../common/Copyable';
import { LoadingCard } from '../common/LoadingCard';

// Total column count (incl. the mobile-only toggle) for the expanded detail row's colSpan.
const COLUMN_COUNT = 7;

// Container: resolves the builds that produced a program buffer's staged binary and renders them.
// A buffer has no program id to look up in the OSEC registry, so we hash its bytes with the same
// `hashProgramBuffer` used elsewhere and resolve that hash against `/resolve-hash`.
export function BufferBuildCard({ buffer }: { buffer: ProgramBufferAccountInfo; pubkey: PublicKey }) {
    const { cluster } = useCluster();
    const bufferHash = React.useMemo(() => hashProgramBuffer(buffer), [buffer]);
    const { data, error, isLoading } = useResolveBuildsByHash(bufferHash);

    return (
        <BaseBufferBuildCard
            builds={data?.builds}
            bufferHash={bufferHash}
            isLoading={isLoading}
            error={Boolean(error)}
            clusterSupported={supportsVerifiedBuilds(cluster)}
        />
    );
}

// Presentational split so stories/tests drive every state without the network.
export function BaseBufferBuildCard({
    builds,
    bufferHash,
    isLoading,
    error,
    // OSEC hosts no registry for Testnet/Custom, so no resolve-hash lookup happens there. Defaults
    // to true so stories and tests that exercise the build states need not opt in.
    clusterSupported = true,
}: {
    builds: OsecBuild[] | undefined;
    bufferHash: string | undefined;
    isLoading: boolean;
    error: boolean;
    clusterSupported?: boolean;
}) {
    if (!clusterSupported) {
        return (
            <Card ui="dashkit">
                <CardBody ui="dashkit" className="text-center">
                    Verified Builds only available on Mainnet and Devnet.
                </CardBody>
            </Card>
        );
    }

    if (isLoading) {
        return <LoadingCard message="Resolving buffer build hash" />;
    }

    if (error) {
        return <ErrorCard text="Error loading buffer build information" />;
    }

    const orderedBuilds = builds ? dedupeAndSortBuilds(builds) : [];

    if (!bufferHash || orderedBuilds.length === 0) {
        return (
            <Card ui="dashkit">
                <CardBody ui="dashkit" className="text-center">
                    No verified builds found for this buffer&apos;s binary. For more information, see the{' '}
                    <Link href={VERIFIED_BUILDS_GUIDE_URL} target="_blank">
                        Verified Build Guide
                    </Link>
                    .
                </CardBody>
            </Card>
        );
    }

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    Buffer Build
                </CardTitle>
                <small>Information provided by osec.io</small>
            </CardHeader>
            <Alert className="mb-1.5 mt-1.5">
                These are completed builds whose compiled output matches this buffer&apos;s binary. A match does not
                imply that the program has been audited. For more details, refer to the{' '}
                <ExternalLink href={VERIFIED_BUILDS_GUIDE_URL}>
                    Verified Builds Guide <ExternalLinkIcon className="ml-[3px] align-text-top" size={13} />
                </ExternalLink>
                .
            </Alert>
            <TableCardBodyHeaded layout="expanded" headerComponent={<BufferBuildHeader />}>
                {orderedBuilds.map(build => (
                    <BufferBuildRow key={build.build_id} build={build} />
                ))}
            </TableCardBodyHeaded>
        </Card>
    );
}

// `hidden lg:table-cell` columns collapse on small screens; their content reappears inside the
// expandable detail row below. The trailing toggle column is the inverse (`lg:hidden`) so it only
// shows on the small-screen layout where expansion is needed.
function BufferBuildHeader() {
    return (
        <BaseTable.Row>
            <BaseTable.HeaderCell className="whitespace-nowrap">Program</BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="whitespace-nowrap">Repository</BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="hidden whitespace-nowrap lg:table-cell">Commit</BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="hidden whitespace-nowrap lg:table-cell">Trusted</BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="hidden whitespace-nowrap lg:table-cell">
                Matches Deployed
            </BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="hidden whitespace-nowrap text-right lg:table-cell">
                Date
            </BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="w-10 lg:hidden" aria-label="Toggle details" />
        </BaseTable.Row>
    );
}

function BufferBuildRow({ build }: { build: OsecBuild }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const detailId = `buffer-build-detail-${build.build_id}`;

    return (
        <Fragment>
            <BaseTable.Row>
                <BaseTable.Cell className="whitespace-nowrap">
                    <Address pubkey={new PublicKey(build.program_id)} link />
                </BaseTable.Cell>
                <BaseTable.Cell className="[overflow-wrap:anywhere]">
                    <RepositoryContent build={build} />
                </BaseTable.Cell>
                <BaseTable.Cell className="hidden whitespace-nowrap lg:table-cell">
                    <CommitContent commit={build.commit} />
                </BaseTable.Cell>
                <BaseTable.Cell className="hidden whitespace-nowrap lg:table-cell">
                    <TrustedBadge value={build.trusted} />
                </BaseTable.Cell>
                <BaseTable.Cell className="hidden whitespace-nowrap lg:table-cell">
                    <MatchesDeployedBadge value={build.matches_deployed} />
                </BaseTable.Cell>
                <BaseTable.Cell className="hidden whitespace-nowrap text-right font-mono lg:table-cell">
                    {formatCompletedAt(build.completed_at)}
                </BaseTable.Cell>
                <BaseTable.Cell className="text-right lg:hidden">
                    <ExpandInfoButton
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded(prev => !prev)}
                        controlsId={detailId}
                    />
                </BaseTable.Cell>
            </BaseTable.Row>
            {isExpanded && (
                <BaseTable.Row className="lg:hidden">
                    <BaseTable.Cell colSpan={COLUMN_COUNT} className="bg-dk-gray-900-dark/40">
                        <div id={detailId} className="flex flex-col gap-2">
                            <DetailItem label="Commit">
                                <CommitContent commit={build.commit} />
                            </DetailItem>
                            <DetailItem label="Trusted">
                                <TrustedBadge value={build.trusted} />
                            </DetailItem>
                            <DetailItem label="Matches Deployed">
                                <MatchesDeployedBadge value={build.matches_deployed} />
                            </DetailItem>
                            <DetailItem label="Date">
                                <span className="font-mono">{formatCompletedAt(build.completed_at)}</span>
                            </DetailItem>
                        </div>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
        </Fragment>
    );
}

// A label/value pair for the small-screen expanded detail, mirroring the hidden desktop columns.
function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-dark-muted-foreground">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    );
}

function RepositoryContent({ build }: { build: OsecBuild }) {
    // Trim trailing slashes so the composed `<repo>/tree/<sha>` link has no double slash; repoLabel
    // renders a compact display label (`.../v4` not `https://.../v4/`).
    const repoUrl = composeOnchainRepoUrl(trimTrailingSlashes(build.repository), build.commit);
    const label = repoLabel(build.repository);

    if (repoUrl) {
        return (
            <ExternalLink className="font-mono" href={repoUrl}>
                {label}
                <ExternalLinkIcon className="ml-1.5 inline-block align-text-top" size={13} />
            </ExternalLink>
        );
    }
    return <span className="font-mono">{label || '-'}</span>;
}

function CommitContent({ commit }: { commit: string }) {
    if (!commit) return <>-</>;
    return (
        <Copyable text={commit}>
            <span className="font-mono">{commit.slice(0, 7)}</span>
        </Copyable>
    );
}

function TrustedBadge({ value }: { value: boolean }) {
    return (
        <Badge ui="dashkit" variant={value ? 'success' : 'secondary'}>
            {String(value)}
        </Badge>
    );
}

function MatchesDeployedBadge({ value }: { value: boolean }) {
    return (
        <Badge ui="dashkit" variant={value ? 'success' : 'warning'}>
            {String(value)}
        </Badge>
    );
}

function formatCompletedAt(completedAt: string): string {
    return new Date(completedAt).toUTCString();
}
