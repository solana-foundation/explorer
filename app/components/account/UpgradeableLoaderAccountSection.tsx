import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { Address } from '@components/common/Address';
import { DownloadableIcon } from '@components/common/Downloadable';
import { InfoTooltip } from '@components/common/InfoTooltip';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { AccountDownloadDropdown } from '@features/account';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { addressLabel } from '@utils/tx';
import {
    ProgramAccountInfo,
    ProgramBufferAccountInfo,
    ProgramDataAccountInfo,
    UpgradeableLoaderAccount,
} from '@validators/accounts/upgradeable-program';
import Link from 'next/link';
import React from 'react';
import { ExternalLink, RefreshCw } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { ProgramSecurityTXTBadge } from '@/app/features/security-txt/ui/SecurityTXTBadge';
import { ProgramSecurityTXTLabel } from '@/app/features/security-txt/ui/SecurityTXTLabel';
import { useSquadsMultisigLookup } from '@/app/providers/squadsMultisig';
import { refreshAnalytics } from '@/app/shared/lib/analytics';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';
import { Cluster } from '@/app/utils/cluster';
import { useClusterPath } from '@/app/utils/url';

import { VerifiedProgramBadge } from '../common/VerifiedProgramBadge';

export function UpgradeableLoaderAccountSection({
    account,
    parsedData,
    programData,
}: {
    account: Account;
    parsedData: UpgradeableLoaderAccount;
    programData: ProgramDataAccountInfo | undefined;
}) {
    switch (parsedData.type) {
        case 'program': {
            return (
                <UpgradeableProgramSection
                    account={account}
                    programAccount={parsedData.info}
                    programData={programData}
                />
            );
        }
        case 'programData': {
            return <UpgradeableProgramDataSection account={account} programData={parsedData.info} />;
        }
        case 'buffer': {
            return <UpgradeableProgramBufferSection account={account} programBuffer={parsedData.info} />;
        }
        case 'uninitialized': {
            return <UnknownAccountCard account={account} />;
        }
    }
}

export function UpgradeableProgramSection({
    account,
    programAccount,
    programData,
}: {
    account: Account;
    programAccount: ProgramAccountInfo;
    programData: ProgramDataAccountInfo | undefined;
}) {
    const refresh = useRefreshAccount();
    const { cluster } = useCluster();
    const { data: squadMapInfo } = useSquadsMultisigLookup(programData?.authority, cluster);

    const label = addressLabel(account.pubkey.toBase58(), cluster);

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit" className="e-gap-2">
                <CardTitle as="h3" ui="dashkit" className="e-flex e-items-center">
                    {programData === undefined && 'Closed '}Program Account
                </CardTitle>
                <Button
                    ui="dashkit"
                    variant="white"
                    size="sm"
                    onClick={() => {
                        refreshAnalytics.trackButtonClicked('program_section');
                        refresh(account.pubkey, 'parsed');
                    }}
                >
                    <RefreshCw className="align-text-top e-mr-1.5" size={13} />
                    Refresh
                </Button>
                <AccountDownloadDropdown pubkey={account.pubkey} space={account.space} />
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {label && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Address Label</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">{label}</BaseTable.Cell>
                    </BaseTable.Row>
                )}
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right e-uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Executable</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">{programData !== undefined ? 'Yes' : 'No'}</BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Executable Data{programData === undefined && ' (Closed)'}</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={programAccount.programData} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {programData !== undefined && (
                    <>
                        <BaseTable.Row>
                            <BaseTable.Cell>Upgradeable</BaseTable.Cell>
                            <BaseTable.Cell className="e-text-right">
                                {programData.authority !== null ? 'Yes' : 'No'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell>
                                <VerifiedLabel />
                            </BaseTable.Cell>
                            <BaseTable.Cell className="e-text-right">
                                <VerifiedProgramBadge programData={programData} pubkey={account.pubkey} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell>
                                <ProgramSecurityTXTLabel programPubkey={account.pubkey} />
                            </BaseTable.Cell>
                            <BaseTable.Cell className="e-text-right">
                                <ProgramSecurityTXTBadge programData={programData} programPubkey={account.pubkey} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell>Last Deployed Slot</BaseTable.Cell>
                            <BaseTable.Cell className="e-text-right">
                                <Slot slot={programData.slot} link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        {programData.authority !== null && (
                            <>
                                <BaseTable.Row>
                                    <BaseTable.Cell>Upgrade Authority</BaseTable.Cell>
                                    <BaseTable.Cell className="e-text-right">
                                        {cluster == Cluster.MainnetBeta && squadMapInfo?.isSquad ? (
                                            <MultisigBadge pubkey={account.pubkey} />
                                        ) : null}
                                        <Address pubkey={programData.authority} alignRight link />
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                            </>
                        )}
                    </>
                )}
            </TableCardBody>
        </Card>
    );
}

function MultisigBadge({ pubkey }: { pubkey: PublicKey }) {
    const programMultisigTabPath = useClusterPath({ pathname: `/address/${pubkey.toBase58()}/program-multisig` });
    return (
        <h3 className="e-mb-0">
            <Badge ui="dashkit" variant="success" asChild>
                <Link href={programMultisigTabPath}>Program Multisig</Link>
            </Badge>
        </h3>
    );
}

function VerifiedLabel() {
    return (
        <InfoTooltip text="Verified builds allow users to ensure that the hash of the on-chain program matches the hash of the program of the given codebase (registry hosted by osec.io).">
            <Link
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/Ellipsis-Labs/solana-verifiable-build"
            >
                <span className="security-txt-link-color-hack-reee">Verified Build</span>
                <ExternalLink className="align-text-top e-ml-1.5" size={13} />
            </Link>
        </InfoTooltip>
    );
}

export function UpgradeableProgramDataSection({
    account,
    programData,
}: {
    account: Account;
    programData: ProgramDataAccountInfo;
}) {
    const refresh = useRefreshAccount();
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="e-flex e-items-center">
                    Program Executable Data Account
                </CardTitle>
                <Button
                    ui="dashkit"
                    variant="white"
                    size="sm"
                    onClick={() => {
                        refreshAnalytics.trackButtonClicked('program_data_section');
                        refresh(account.pubkey, 'parsed');
                    }}
                >
                    <RefreshCw className="align-text-top e-mr-1.5" size={13} />
                    Refresh
                </Button>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right e-uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {account.space !== undefined && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Data Size (Bytes)</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">
                            <DownloadableIcon data={programData.data[0]} filename={`${account.pubkey.toString()}.bin`}>
                                <span className="e-mr-1.5">{account.space}</span>
                            </DownloadableIcon>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
                <BaseTable.Row>
                    <BaseTable.Cell>Upgradeable</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        {programData.authority !== null ? 'Yes' : 'No'}
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Last Deployed Slot</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Slot slot={programData.slot} link />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {programData.authority !== null && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Upgrade Authority</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">
                            <Address pubkey={programData.authority} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
            </TableCardBody>
        </Card>
    );
}

export function UpgradeableProgramBufferSection({
    account,
    programBuffer,
}: {
    account: Account;
    programBuffer: ProgramBufferAccountInfo;
}) {
    const refresh = useRefreshAccount();
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="e-flex e-items-center">
                    Program Deploy Buffer Account
                </CardTitle>
                <Button
                    ui="dashkit"
                    variant="white"
                    size="sm"
                    onClick={() => {
                        refreshAnalytics.trackButtonClicked('program_buffer_section');
                        refresh(account.pubkey, 'parsed');
                    }}
                >
                    <RefreshCw className="align-text-top e-mr-1.5" size={13} />
                    Refresh
                </Button>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right e-uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {account.space !== undefined && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Data Size (Bytes)</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">{account.space}</BaseTable.Cell>
                    </BaseTable.Row>
                )}
                {programBuffer.authority !== null && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Deploy Authority</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">
                            <Address pubkey={programBuffer.authority} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
                <BaseTable.Row>
                    <BaseTable.Cell>Owner</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={account.owner} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            </TableCardBody>
        </Card>
    );
}
