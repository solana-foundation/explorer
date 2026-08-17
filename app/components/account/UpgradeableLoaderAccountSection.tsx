import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { Address } from '@components/common/Address';
import { DownloadableIcon } from '@components/common/Downloadable';
import { InfoTooltip } from '@components/common/InfoTooltip';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { addressLabel } from '@utils/tx';
import { hashProgramBuffer } from '@utils/verified-builds';
import {
    ProgramAccountInfo,
    ProgramBufferAccountInfo,
    ProgramDataAccountInfo,
    UpgradeableLoaderAccount,
} from '@validators/accounts/upgradeable-program';
import Link from 'next/link';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { ProgramSecurityTXTBadge } from '@/app/features/security-txt/ui/SecurityTXTBadge';
import { ProgramSecurityTXTLabel } from '@/app/features/security-txt/ui/SecurityTXTLabel';
import { useSquadsMultisigLookup } from '@/app/providers/squadsMultisig';
import { refreshAnalytics } from '@/app/shared/lib/analytics';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { KeyValue, LABEL_WIDTH } from '@/app/shared/ui/key-value';
import { BaseTable } from '@/app/shared/ui/Table';
import { Cluster } from '@/app/utils/cluster';
import { useClusterPath } from '@/app/utils/url';

import { Copyable } from '../common/Copyable';
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
    // TODO: adopt @explorer/entity-inspector's accounts module (src/accounts: classifyAccountKindBase + kinds.ts; needs a browser-safe ./accounts subpath) instead of this inline kind dispatch
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
        <AccountCard
            title={`${programData === undefined ? 'Closed ' : ''}Program Account`}
            account={account}
            headerOutside
            refresh={() => refresh(account.pubkey, 'parsed')}
            analyticsSection="program_section"
        >
            <KeyValue label="Address" labelWidth={LABEL_WIDTH} row>
                <Address pubkey={account.pubkey} raw />
            </KeyValue>
            {label && (
                <KeyValue label="Address Label" labelWidth={LABEL_WIDTH} row>
                    {label}
                </KeyValue>
            )}
            <KeyValue label="Balance (SOL)" labelWidth={LABEL_WIDTH} row>
                <SolBalance lamports={account.lamports} />
            </KeyValue>
            <KeyValue label="Executable" labelWidth={LABEL_WIDTH} row>
                {programData !== undefined ? 'Yes' : 'No'}
            </KeyValue>
            <KeyValue
                label={`Executable Data${programData === undefined ? ' (Closed)' : ''}`}
                labelWidth={LABEL_WIDTH}
                row
            >
                <Address pubkey={programAccount.programData} link />
            </KeyValue>
            {programData !== undefined && (
                <>
                    <KeyValue label="Upgradeable" labelWidth={LABEL_WIDTH} row>
                        {programData.authority !== null ? 'Yes' : 'No'}
                    </KeyValue>
                    <KeyValue label={<VerifiedLabel />} labelWidth={LABEL_WIDTH} row>
                        <VerifiedProgramBadge programData={programData} pubkey={account.pubkey} />
                    </KeyValue>
                    <KeyValue label={<ProgramSecurityTXTLabel />} labelWidth={LABEL_WIDTH} row>
                        <ProgramSecurityTXTBadge programPubkey={account.pubkey} />
                    </KeyValue>
                    <KeyValue label="Last Deployed Slot" labelWidth={LABEL_WIDTH} row>
                        <Slot slot={programData.slot} link />
                    </KeyValue>
                    {programData.authority !== null && (
                        <KeyValue label="Upgrade Authority" labelWidth={LABEL_WIDTH} row>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="min-w-0">
                                    <Address pubkey={programData.authority} link />
                                </span>
                                {cluster == Cluster.MainnetBeta && squadMapInfo?.isSquad && (
                                    <MultisigBadge pubkey={account.pubkey} />
                                )}
                            </div>
                        </KeyValue>
                    )}
                </>
            )}
        </AccountCard>
    );
}

function MultisigBadge({ pubkey }: { pubkey: PublicKey }) {
    const programMultisigTabPath = useClusterPath({ pathname: `/address/${pubkey.toBase58()}/program-multisig` });
    return (
        <Badge ui="tw" tone="soft" variant="success" className="shrink-0" asChild>
            <Link href={programMultisigTabPath}>Program Multisig</Link>
        </Badge>
    );
}

function VerifiedLabel() {
    return (
        <InfoTooltip text="Verified builds allow users to ensure that the hash of the on-chain program matches the hash of the program of the given codebase (registry hosted by osec.io).">
            Verified Build
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
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
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
                    <RefreshCw className="mr-1.5 align-text-top" size={13} />
                    Refresh
                </Button>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="text-right uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {account.space !== undefined && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Data Size (Bytes)</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <DownloadableIcon data={programData.data[0]} filename={`${account.pubkey.toString()}.bin`}>
                                <span className="mr-1.5">{account.space}</span>
                            </DownloadableIcon>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
                <BaseTable.Row>
                    <BaseTable.Cell>Upgradeable</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {programData.authority !== null ? 'Yes' : 'No'}
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Last Deployed Slot</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Slot slot={programData.slot} link />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {programData.authority !== null && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Upgrade Authority</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
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
    const bufferHash = React.useMemo(() => hashProgramBuffer(programBuffer), [programBuffer]);
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
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
                    <RefreshCw className="mr-1.5 align-text-top" size={13} />
                    Refresh
                </Button>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="text-right uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {account.space !== undefined && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Data Size (Bytes)</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">{account.space}</BaseTable.Cell>
                    </BaseTable.Row>
                )}
                {bufferHash && (
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            <InfoTooltip text="sha256 of the buffer's program bytes with trailing zero padding removed — the same hash as `solana-verify get-buffer-hash`. Compare it against the build hash you expect to deploy.">
                                <span className="text-dk-white">Buffer Hash</span>
                            </InfoTooltip>
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <div className="flex items-center justify-end">
                                <Copyable text={bufferHash}>
                                    <span className="break-all font-mono">{bufferHash}</span>
                                </Copyable>
                            </div>
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
                {programBuffer.authority !== null && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Deploy Authority</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <Address pubkey={programBuffer.authority} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
                <BaseTable.Row>
                    <BaseTable.Cell>Owner</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={account.owner} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            </TableCardBody>
        </Card>
    );
}
