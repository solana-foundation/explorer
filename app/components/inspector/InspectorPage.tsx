'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useFetchAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { useFetchRawTransaction, useRawTransactionDetails } from '@providers/transactions/raw';
import usePrevious from '@react-hook/previous';
import { Connection, MessageV0, PACKET_DATA_SIZE, PublicKey, VersionedMessage } from '@solana/web3.js';
import { generated, PROGRAM_ADDRESS as SQUADS_V4_PROGRAM_ADDRESS } from '@sqds/multisig';
const { VaultTransaction } = generated;

import { useClusterPath } from '@utils/url';
import bs58 from 'bs58';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';

import { AccountsCard } from './AccountsCard';
import { AddressTableLookupsCard } from './AddressTableLookupsCard';
import { AddressWithContext, createFeePayerValidator } from './AddressWithContext';
import { InstructionsSection } from './InstructionsSection';
import { MIN_MESSAGE_LENGTH, RawInput } from './RawInputCard';
import { TransactionSignatures } from './SignaturesCard';
import { SimulatorCard } from './SimulatorCard';

export type TransactionData = {
    rawMessage: Uint8Array;
    message: VersionedMessage;
    signatures?: (string | null)[];
};

export type SquadsProposalAccountData = {
    account: string;
};

export type InspectorData = TransactionData | SquadsProposalAccountData;

function isSquadsProposalAccountData(data: InspectorData): data is SquadsProposalAccountData {
    return 'account' in data;
}

// Decode a url param and return the result. If decoding fails, return whether
// the param should be deleted.
function decodeParam(params: URLSearchParams, name: string): string | boolean {
    const param = params.get(name);
    if (param === null) return false;
    try {
        return decodeURIComponent(param);
    } catch (err) {
        return true;
    }
}

// Decode a signatures param and throw an error on failure
function decodeSignatures(signaturesParam: string): (string | null)[] {
    let signatures;
    try {
        signatures = JSON.parse(signaturesParam);
    } catch (err) {
        throw new Error('Signatures param is not valid JSON');
    }

    if (!Array.isArray(signatures)) {
        throw new Error('Signatures param is not a JSON array');
    }

    const validSignatures: (string | null)[] = [];
    for (const signature of signatures) {
        if (signature === null) {
            validSignatures.push(signature);
            continue;
        }

        if (typeof signature !== 'string') {
            throw new Error('Signature is not a string');
        }

        try {
            bs58.decode(signature);
            validSignatures.push(signature);
        } catch (err) {
            throw new Error('Signature is not valid base58');
        }
    }

    return validSignatures;
}

// Decodes url params into transaction data if possible. If decoding fails,
// URL params are returned as a string that will prefill the transaction
// message input field for debugging. Returns a tuple of [result, shouldRefreshUrl]
function decodeUrlParams(
    params: URLSearchParams
): [TransactionData | string | SquadsProposalAccountData, URLSearchParams, boolean] {
    const messageParam = decodeParam(params, 'message');
    const signaturesParam = decodeParam(params, 'signatures');
    const squadsTxParam = decodeParam(params, 'squadsTx');

    let refreshUrl = false;
    if (signaturesParam === true) {
        params.delete('signatures');
        refreshUrl = true;
    }

    // Check for Squads transaction parameter
    if (typeof squadsTxParam === 'string') {
        try {
            // Validate that it's a valid public key
            new PublicKey(squadsTxParam);
            return [{ account: squadsTxParam }, params, refreshUrl];
        } catch (err) {
            params.delete('squadsTx');
            refreshUrl = true;
        }
    }

    if (typeof messageParam === 'boolean') {
        if (messageParam) {
            params.delete('message');
            params.delete('signatures');
            refreshUrl = true;
        }
        return ['', params, refreshUrl];
    }

    let signatures: (string | null)[] | undefined = undefined;
    if (typeof signaturesParam === 'string') {
        try {
            signatures = decodeSignatures(signaturesParam);
        } catch (err) {
            params.delete('signatures');
            refreshUrl = true;
        }
    }

    try {
        const buffer = Uint8Array.from(atob(messageParam), c => c.charCodeAt(0));

        if (buffer.length < MIN_MESSAGE_LENGTH) {
            throw new Error('message buffer is too short');
        }

        const message = VersionedMessage.deserialize(buffer);
        const data = {
            message,
            rawMessage: buffer,
            signatures,
        };
        return [data, params, refreshUrl];
    } catch (err) {
        params.delete('message');
        refreshUrl = true;
        return [messageParam, params, true];
    }
}

function SquadsProposalInspectorCard({ account, onClear }: { account: string; onClear: () => void }) {
    const { url } = useCluster();

    const fetcher = React.useCallback(async () => {
        const connection = new Connection(url);
        try {
            // First check if the account exists and is owned by the Squads program
            const accountInfo = await connection.getAccountInfo(new PublicKey(account), 'confirmed');

            if (!accountInfo) {
                throw new Error('Account not found');
            }

            // Check if the account is owned by the Squads program
            const isSquadsAccount = accountInfo.owner.toString() === SQUADS_V4_PROGRAM_ADDRESS.toString();

            if (!isSquadsAccount) {
                throw new Error(`Account ${account} is not a valid Squads transaction account`);
            }

            return await VaultTransaction.fromAccountAddress(connection, new PublicKey(account), 'confirmed');
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to fetch account data');
        }
    }, [account, url]);

    const {
        data: vaultTransaction,
        error,
        isLoading,
    } = useSWR(['squads-proposal', account, url], fetcher, {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        suspense: false,
    });

    if (isLoading) {
        return <LoadingCard message="Loading Squads transaction..." />;
    }

    if (error || !vaultTransaction) {
        return (
            <ErrorCard text={`Error loading vault transaction: ${error?.message}`} retry={onClear} retryText="Clear" />
        );
    }

    // Convert VaultTransactionMessage to a format compatible with Message
    const convertVaultTransactionToMessage = (vaultTx: typeof VaultTransaction.prototype): VersionedMessage => {
        const { message } = vaultTx;
        const accountKeys = message.accountKeys;

        // Create a standard Message object with the necessary fields
        const solanaMessage = new MessageV0({
            addressTableLookups: message.addressTableLookups.map(x => ({
                ...x,
                readonlyIndexes: Array.from(x.readonlyIndexes),
                writableIndexes: Array.from(x.writableIndexes),
            })),
            compiledInstructions: message.instructions.map(instruction => ({
                accountKeyIndexes: Array.from(instruction.accountIndexes),
                data: Buffer.from(instruction.data),
                programIdIndex: instruction.programIdIndex,
            })),
            header: {
                numReadonlySignedAccounts: message.numSigners - message.numWritableSigners,
                numReadonlyUnsignedAccounts:
                    message.accountKeys.length - message.numSigners - message.numWritableNonSigners,
                numRequiredSignatures: message.numSigners,
            },
            recentBlockhash: bs58.encode(Uint8Array.from(new Array(32).fill(0))),
            staticAccountKeys: accountKeys,
        });

        return solanaMessage;
    };

    // Create a serialized version of the message for rawMessage
    const convertedMessage = convertVaultTransactionToMessage(vaultTransaction);
    const serializedMessage = convertedMessage.serialize();

    return (
        <LoadedView
            transaction={{
                message: convertedMessage,
                rawMessage: serializedMessage,
                signatures: undefined,
            }}
            onClear={onClear}
            showTokenBalanceChanges={false}
        />
    );
}

export function TransactionInspectorPage({
    signature,
    showTokenBalanceChanges,
}: {
    signature?: string;
    showTokenBalanceChanges: boolean;
}) {
    const [inspectorData, setInspectorData] = React.useState<InspectorData>();
    const currentSearchParams = useSearchParams();
    const currentPathname = usePathname();
    const router = useRouter();
    const [paramString, setParamString] = React.useState<string>();

    // Sync message with url search params
    const prevInspectorData = usePrevious(inspectorData);
    React.useEffect(() => {
        if (signature) return;
        if (inspectorData && inspectorData !== prevInspectorData) {
            if (isSquadsProposalAccountData(inspectorData)) {
                // Handle Squads proposal URL params
                const nextQueryParams = new URLSearchParams(currentSearchParams?.toString());
                nextQueryParams.set('squadsTx', inspectorData.account);
                // Remove any other transaction params that might exist
                nextQueryParams.delete('message');
                nextQueryParams.delete('signatures');
                const queryString = nextQueryParams.toString();
                router.replace(`${currentPathname}?${queryString}`);
                return;
            }

            let nextQueryParams;

            if (inspectorData.signatures !== undefined) {
                const signaturesParam = encodeURIComponent(JSON.stringify(inspectorData.signatures));
                if (currentSearchParams.get('signatures') !== signaturesParam) {
                    nextQueryParams ||= new URLSearchParams(currentSearchParams?.toString());
                    nextQueryParams.set('signatures', signaturesParam);
                }
            }

            const base64 = btoa(String.fromCharCode.apply(null, Array.from(inspectorData.rawMessage)));
            const newParam = encodeURIComponent(base64);
            if (currentSearchParams.get('message') !== newParam) {
                nextQueryParams ||= new URLSearchParams(currentSearchParams?.toString());
                nextQueryParams.set('message', newParam);
            }
            const queryString = nextQueryParams?.toString();
            if (queryString) {
                router.replace(`${currentPathname}?${queryString.toString()}`);
            }
        }
    }, [currentPathname, currentSearchParams, prevInspectorData, router, signature, inspectorData]);

    const reset = React.useCallback(() => {
        const nextQueryParams = new URLSearchParams(currentSearchParams?.toString());
        nextQueryParams.delete('message');
        nextQueryParams.delete('signatures');
        nextQueryParams.delete('squadsTx');
        const queryString = nextQueryParams?.toString();
        router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
    }, [currentPathname, currentSearchParams, router]);

    // Decode the message url param whenever it changes
    React.useEffect(() => {
        const [result, nextParams, refreshUrl] = decodeUrlParams(new URLSearchParams(currentSearchParams?.toString()));
        if (refreshUrl) {
            const queryString = nextParams.toString();
            router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
        }

        if (typeof result === 'string') {
            setParamString(result);
            setInspectorData(undefined);
        } else {
            setParamString(undefined);
            setInspectorData(result);
        }
    }, [currentPathname, currentSearchParams, router]);

    return (
        <div className="container mt-4">
            <div className="header">
                <div className="header-body">
                    <h2 className="header-title">Transaction Inspector</h2>
                </div>
            </div>
            {signature ? (
                <PermalinkView signature={signature} reset={reset} showTokenBalanceChanges={showTokenBalanceChanges} />
            ) : inspectorData ? (
                isSquadsProposalAccountData(inspectorData) ? (
                    <SquadsProposalInspectorCard account={inspectorData.account} onClear={reset} />
                ) : (
                    <LoadedView
                        transaction={inspectorData}
                        onClear={reset}
                        showTokenBalanceChanges={showTokenBalanceChanges}
                    />
                )
            ) : (
                <RawInput value={paramString} setTransactionData={setInspectorData} />
            )}
        </div>
    );
}

function PermalinkView({
    signature,
    showTokenBalanceChanges,
}: {
    signature: string;
    reset: () => void;
    showTokenBalanceChanges: boolean;
}) {
    const details = useRawTransactionDetails(signature);
    const fetchTransaction = useFetchRawTransaction();
    const refreshTransaction = () => fetchTransaction(signature);
    const transaction = details?.data?.raw;
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const router = useRouter();
    const reset = React.useCallback(() => {
        router.push(inspectorPath);
    }, [inspectorPath, router]);

    // Fetch details on load
    React.useEffect(() => {
        if (!details) fetchTransaction(signature);
    }, [signature, details, fetchTransaction]);

    if (!details || details.status === FetchStatus.Fetching) {
        return <LoadingCard />;
    } else if (details.status === FetchStatus.FetchFailed) {
        return <ErrorCard retry={refreshTransaction} text="Failed to fetch transaction" />;
    } else if (!transaction) {
        return <ErrorCard text="Transaction was not found" retry={reset} retryText="Reset" />;
    }

    const { message, signatures } = transaction;
    const tx = { message, rawMessage: message.serialize(), signatures };

    return <LoadedView transaction={tx} onClear={reset} showTokenBalanceChanges={showTokenBalanceChanges} />;
}

function LoadedView({
    transaction,
    onClear,
    showTokenBalanceChanges,
}: {
    transaction: TransactionData;
    onClear: () => void;
    showTokenBalanceChanges: boolean;
}) {
    const { message, rawMessage, signatures } = transaction;

    const fetchAccountInfo = useFetchAccountInfo();
    React.useEffect(() => {
        for (const lookup of message.addressTableLookups) {
            fetchAccountInfo(lookup.accountKey, 'parsed');
        }
    }, [message, fetchAccountInfo]);

    return (
        <>
            <OverviewCard message={message} raw={rawMessage} onClear={onClear} />
            <SimulatorCard message={message} showTokenBalanceChanges={showTokenBalanceChanges} />
            {signatures && <TransactionSignatures message={message} signatures={signatures} rawMessage={rawMessage} />}
            <AccountsCard message={message} />
            <AddressTableLookupsCard message={message} />
            <InstructionsSection message={message} />
        </>
    );
}

const DEFAULT_FEES = {
    lamportsPerSignature: 5000,
};

function OverviewCard({ message, raw, onClear }: { message: VersionedMessage; raw: Uint8Array; onClear: () => void }) {
    const fee = message.header.numRequiredSignatures * DEFAULT_FEES.lamportsPerSignature;
    const feePayerValidator = createFeePayerValidator(fee);

    const size = React.useMemo(() => {
        const sigBytes = 1 + 64 * message.header.numRequiredSignatures;
        return sigBytes + raw.length;
    }, [message, raw]);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-header-title">Transaction Overview</h3>
                    <button className="btn btn-sm d-flex btn-white" onClick={onClear}>
                        Clear
                    </button>
                </div>
                <TableCardBody>
                    <tr>
                        <td>Serialized Size</td>
                        <td className="text-lg-end">
                            <div className="d-flex align-items-end flex-column">
                                {size} bytes
                                <span className={size <= PACKET_DATA_SIZE ? 'text-muted' : 'text-warning'}>
                                    Max transaction size is {PACKET_DATA_SIZE} bytes
                                </span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Fees</td>
                        <td className="text-lg-end">
                            <div className="d-flex align-items-end flex-column">
                                <SolBalance lamports={fee} />
                                <span className="text-muted">
                                    {`Each signature costs ${DEFAULT_FEES.lamportsPerSignature} lamports`}
                                </span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div className="d-flex align-items-start flex-column">
                                Fee payer
                                <span className="mt-1">
                                    <span className="badge bg-info-soft me-2">Signer</span>
                                    <span className="badge bg-danger-soft me-2">Writable</span>
                                </span>
                            </div>
                        </td>
                        <td className="text-end">
                            {message.staticAccountKeys.length === 0 ? (
                                'No Fee Payer'
                            ) : (
                                <AddressWithContext
                                    pubkey={message.staticAccountKeys[0]}
                                    validator={feePayerValidator}
                                />
                            )}
                        </td>
                    </tr>
                </TableCardBody>
            </div>
        </>
    );
}
