import { ErrorCard } from '@components/common/ErrorCard';
import { TableCardBody } from '@components/common/TableCardBody';
import { UpgradeableLoaderAccountData } from '@providers/accounts';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { ExternalLink } from 'react-feather';

import { CardBody, CardHeader } from '@/app/shared/ui/Card';
import { OsecRegistryInfo, useVerifiedProgram, VerificationStatus } from '@/app/utils/verified-builds';

import { Address } from '../common/Address';
import { Copyable } from '../common/Copyable';
import { LoadingCard } from '../common/LoadingCard';

export function VerifiedBuildCard({ data, pubkey }: { data: UpgradeableLoaderAccountData; pubkey: PublicKey }) {
    // suspense:false -- the chain mixes with a non-suspense SWR (useIdlFromAnchorProgramSeed); the mixed path triggers hook-order warnings under HMR.
    const { data: registryInfo, isLoading } = useVerifiedProgram({
        options: { suspense: false },
        programAuthority: data.programData?.authority ? new PublicKey(data.programData.authority) : null,
        programData: data.programData,
        programId: pubkey,
    });

    return <BaseVerifiedBuildCard data={data} registryInfo={registryInfo ?? null} isLoading={isLoading} />;
}

export function BaseVerifiedBuildCard({
    data,
    registryInfo,
    isLoading,
}: {
    data: UpgradeableLoaderAccountData;
    registryInfo: OsecRegistryInfo | null;
    isLoading: boolean;
}) {
    if (!data.programData) {
        return <ErrorCard text="Account has no data" />;
    }

    if (isLoading) {
        return <LoadingCard message="Fetching last verified build hash" />;
    }

    if (!registryInfo) {
        return (
            <div className="card">
                <CardBody ui="dashkit" className="e-text-center">
                    Verified build information not yet uploaded by the program authority. For more information, see the{' '}
                    <Link href="https://solana.com/developers/guides/advanced/verified-builds" target="_blank">
                        Verified Build Guide
                    </Link>
                    .<br />
                    <br />
                    Note: Some programs were verified using older, deprecated versions of the API and may not include
                    on-chain verification details.
                </CardBody>
            </div>
        );
    }

    // Define the message based on the verification status
    let verificationMessage;
    if (
        registryInfo.verification_status === VerificationStatus.Verified ||
        registryInfo.verification_status === VerificationStatus.PdaUploaded
    ) {
        verificationMessage = 'Information provided by osec.io';
    } else if (registryInfo.verification_status === VerificationStatus.NotVerified) {
        verificationMessage = 'No verified build found';
    }

    return (
        <div className="card security-txt">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title e-mb-0 e-flex e-items-center">Verified Build</h3>
                <small>{verificationMessage}</small>
            </CardHeader>
            <div className="alert e-mb-1.5 e-mt-1.5">
                A verified build badge indicates that this program was built from source code that is publicly
                available, but does not imply that this program has been audited. For more details, refer to the{' '}
                <a
                    href="https://solana.com/developers/guides/advanced/verified-builds"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Verified Builds Guide <ExternalLink className="e-ml-[3px] e-align-text-top" size={13} />
                </a>
                .
            </div>
            <TableCardBody>
                {ROWS.filter(x => x.key in registryInfo).map((x, idx) => {
                    return (
                        <tr key={idx}>
                            <td className="e-w-full">{x.display}</td>
                            <RenderEntry value={registryInfo[x.key]} type={x.type} />
                        </tr>
                    );
                })}
            </TableCardBody>
        </div>
    );
}

enum DisplayType {
    Boolean,
    String,
    URL,
    Date,
    LongString,
    PublicKey,
}

type TableRow = {
    display: string;
    key: keyof OsecRegistryInfo;
    type: DisplayType;
};

const ROWS: TableRow[] = [
    {
        display: 'Verified',
        key: 'is_verified',
        type: DisplayType.Boolean,
    },
    {
        display: 'Message',
        key: 'message',
        type: DisplayType.String,
    },
    {
        display: 'Uploader',
        key: 'signer',
        type: DisplayType.PublicKey,
    },
    {
        display: 'On Chain Hash',
        key: 'on_chain_hash',
        type: DisplayType.String,
    },
    {
        display: 'Executable Hash',
        key: 'executable_hash',
        type: DisplayType.String,
    },
    {
        display: 'Last Verified At',
        key: 'last_verified_at',
        type: DisplayType.Date,
    },
    {
        display: 'Verify Command',
        key: 'verify_command',
        type: DisplayType.LongString,
    },
    {
        display: 'Repository URL',
        key: 'onchain_repo_url',
        type: DisplayType.URL,
    },
];

function RenderEntry({ value, type }: { value: OsecRegistryInfo[keyof OsecRegistryInfo]; type: DisplayType }) {
    switch (type) {
        case DisplayType.Boolean:
            return (
                <td className={'font-monospace e-text-right'}>
                    <span className={cn('badge', `bg-${value ? 'success' : 'warning'}-soft`)}>{new String(value)}</span>
                </td>
            );
        case DisplayType.String:
            if (Object.values(VerificationStatus).includes(value as VerificationStatus)) {
                const badgeClass = value === VerificationStatus.Verified ? 'bg-success-soft' : 'bg-warning-soft';
                const badgeValue = value === VerificationStatus.Verified ? 'true' : 'false';
                return (
                    <td className="font-monospace e-text-right">
                        <span className={`badge ${badgeClass}`}>{badgeValue}</span>
                    </td>
                );
            }
            return (
                <td className="font-monospace e-text-right" style={{ whiteSpace: 'pre' }}>
                    {value && (value as string).length > 1 ? value : '-'}
                </td>
            );
        case DisplayType.LongString:
            return (
                <td className="e-text-right">
                    {value && (value as string).length > 1 ? (
                        <div className="e-flex e-items-center e-justify-end">
                            <Copyable text={value as string}>
                                <span />
                            </Copyable>
                            <pre
                                className="font-monospace e-mb-0 e-text-left"
                                style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                            >
                                {value}
                            </pre>
                        </div>
                    ) : (
                        '-'
                    )}
                </td>
            );
        case DisplayType.URL:
            if (isValidLink(value as string)) {
                return (
                    <td className="e-text-right">
                        <span className="font-monospace">
                            <a rel="noopener noreferrer" target="_blank" href={value as string}>
                                {value}
                                <ExternalLink className="align-text-top e-ml-1.5" size={13} />
                            </a>
                        </span>
                    </td>
                );
            }
            return (
                <td className="font-monospace e-text-right">
                    {value && (value as string).length > 1 ? (value as string).trim() : '-'}
                </td>
            );
        case DisplayType.Date:
            return (
                <td className="font-monospace e-text-right">
                    {value && (value as string).length > 1 ? new Date(value as string).toUTCString() : '-'}
                </td>
            );
        case DisplayType.PublicKey:
            return (
                <td className="font-monospace e-text-right">
                    <Address pubkey={new PublicKey(value as string)} link alignRight />
                </td>
            );
        default:
            break;
    }
    return <></>;
}

function isValidLink(value: string) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch (_err) {
        return false;
    }
}
