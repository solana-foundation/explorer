import { PublicKey, VersionedMessage } from '@solana/web3.js';
import base58 from 'bs58';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import type { InspectorData } from './InspectorPage';

function getMessageDataFromBytes(bytes: Uint8Array): {
    message: VersionedMessage;
    rawMessage: Uint8Array;
} {
    const message = VersionedMessage.deserialize(bytes);
    return {
        message,
        rawMessage: bytes,
    };
}

function getTransactionDataFromUserSuppliedBytes(bytes: Uint8Array): {
    message: VersionedMessage;
    rawMessage: Uint8Array;
    signatures?: string[];
} {
    /**
     * Step 1: Try to parse the bytes as a *transaction* first (ie. with signatures at the front)
     */
    let offset = 0;
    const numSignatures = bytes[offset++];
    // If this were a transaction, would its message expect exactly `numSignatures`?
    let requiredSignaturesByteOffset = 1 + numSignatures * 64;
    if (VersionedMessage.deserializeMessageVersion(bytes.slice(requiredSignaturesByteOffset)) !== 'legacy') {
        requiredSignaturesByteOffset++;
    }
    const numRequiredSignaturesAccordingToMessage = bytes[requiredSignaturesByteOffset];
    if (numRequiredSignaturesAccordingToMessage !== numSignatures) {
        // We looked ahead into the message and could not match the number of signatures indicated
        // by the first byte of the transaction with the expected number of signatures in the
        // message. This is likely not a transaction at all, so try to parse it as a message now.
        return getMessageDataFromBytes(bytes);
    }
    const signatures = [];
    for (let ii = 0; ii < numSignatures; ii++) {
        const signatureBytes = bytes.subarray(offset, offset + 64);
        if (signatureBytes.length !== 64) {
            // We hit the end of the byte array before consuming `numSignatures` signatures. This
            // can't have been a transaction, so try to parse it as a message now.
            return getMessageDataFromBytes(bytes);
        }
        signatures.push(base58.encode(signatureBytes));
        offset += 64;
    }
    try {
        const transactionData = getMessageDataFromBytes(bytes.slice(offset));
        return {
            ...transactionData,
            ...(signatures.length ? { signatures } : null),
        };
    } catch {
        /**
         * Step 2: That didn't work, so presume that the bytes are a message, as asked for in the UI
         */
        return getMessageDataFromBytes(bytes);
    }
}

function parseAccountAddresses(input: string): string[] {
    // Split by commas, newlines, or spaces and filter out empty strings
    return input
        .split(/[\s,]+/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);
}

export const MIN_MESSAGE_LENGTH =
    3 + // header
    1 + // accounts length
    32 + // accounts, must have at least one address for fees
    32 + // recent blockhash
    1; // instructions length

type TabData = {
    id: string;
    label: string;
    content: React.ReactNode;
};

function TabInstructions() {
    const [activeTab, setActiveTab] = React.useState('cli');

    const tabs: TabData[] = [
        {
            content: (
                <div className="p-3">
                    Use <code>--dump-transaction-message</code> flag
                </div>
            ),
            id: 'cli',
            label: 'CLI',
        },
        {
            content: (
                <div className="p-3">
                    Add <code>base64</code> crate dependency and{' '}
                    <code>println!(&quot;{}&quot;, base64::encode(&transaction.message_data()));</code>
                </div>
            ),
            id: 'rust',
            label: 'Rust',
        },
        {
            content: (
                <div className="p-3">
                    <div className="mb-3">
                        <div className="text-decoration-underline mb-2">@solana/web3.js &lt; 2.0.0</div>
                        <div className="mb-2">
                            <div className="mb-1">Legacy Transaction:</div>
                            <code>console.log(tx.serializeMessage().toString(&quot;base64&quot;));</code>
                        </div>
                        <div>
                            <div className="mb-1">Versioned Transaction:</div>
                            <code>console.log(Buffer.from(tx.serialize()).toString(&quot;base64&quot;));</code>
                        </div>
                    </div>
                    <div>
                        <div className="text-decoration-underline mb-2">@solana/web3.js &gt;= 2.0.0</div>
                        <div>
                            <div className="mb-1">Legacy Transaction:</div>
                            <code>console.log(getBase64EncodedWireTransaction(tx));</code>
                        </div>
                    </div>
                </div>
            ),
            id: 'ts',
            label: 'TypeScript',
        },
        {
            content: (
                <div className="p-3">
                    Add <code>vault_transaction</code> from{' '}
                    <code>https://app.squads.so/squads/&lt;squad_id&gt;/transactions/&lt;vault_transaction&gt;</code>
                </div>
            ),
            id: 'squads',
            label: 'Squads',
        },
    ];

    return (
        <div className="instruction-tabs">
            <div className="nav nav-tabs" role="tablist">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`me-3 nav-link ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`tab-pane ${activeTab === tab.id ? 'show active' : ''}`}
                        role="tabpanel"
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function RawInput({
    value,
    setTransactionData,
}: {
    value?: string;
    setTransactionData: (param: InspectorData | undefined) => void;
}) {
    const rawInput = React.useRef<HTMLTextAreaElement>(null);
    const [error, setError] = React.useState<string>();
    const [rows, setRows] = React.useState(3);
    const currentPathname = usePathname();
    const currentSearchParams = useSearchParams();
    const router = useRouter();

    const onInput = React.useCallback(() => {
        const input = rawInput.current?.value;
        if (!input) {
            setError(undefined);
            return;
        }

        // Clear url params when input is detected
        if (currentSearchParams?.get('message')) {
            const nextQueryParams = new URLSearchParams(currentSearchParams?.toString());
            nextQueryParams.delete('message');
            const queryString = nextQueryParams.toString();
            router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
        } else if (currentSearchParams?.get('transaction')) {
            const nextQueryParams = new URLSearchParams(currentSearchParams?.toString());
            nextQueryParams.delete('transaction');
            const queryString = nextQueryParams.toString();
            router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
        }

        // Dynamically expand height based on input length
        setRows(Math.max(3, Math.min(10, Math.round(input.length / 150))));

        let buffer;
        // First try to parse as an account address
        try {
            const accounts = parseAccountAddresses(input);
            if (accounts.length > 0) {
                if (accounts.length > 1) {
                    setError('Please provide only one account address');
                    return;
                }

                // Necessary to validate the account address
                new PublicKey(accounts[0]);

                setTransactionData({ account: accounts[0] });
                setError(undefined);
                return;
            }
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }

        // If not an account address, try to parse as base64 transaction data
        try {
            buffer = Uint8Array.from(atob(input), c => c.charCodeAt(0));
        } catch (err) {
            console.error(err);
            setError('Input must be base64 encoded or a valid account address');
            return;
        }

        try {
            if (buffer.length < MIN_MESSAGE_LENGTH) {
                throw new Error('Input is not long enough to be a valid transaction message.');
            }
            const transactionData = getTransactionDataFromUserSuppliedBytes(buffer);
            setTransactionData(transactionData);
            setError(undefined);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    }, [currentSearchParams, router, currentPathname, setTransactionData]);

    const clearInput = React.useCallback(() => {
        if (rawInput.current) {
            rawInput.current.value = '';
            setError(undefined);
            setTransactionData(undefined);
        }

        // Clear URL params if they exist
        if (currentSearchParams?.get('message') || currentSearchParams?.get('transaction')) {
            const nextQueryParams = new URLSearchParams(currentSearchParams?.toString());
            nextQueryParams.delete('message');
            nextQueryParams.delete('transaction');
            const queryString = nextQueryParams.toString();
            router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
        }
    }, [currentSearchParams, router, currentPathname, setTransactionData]);

    React.useEffect(() => {
        const input = rawInput.current;
        if (input && value) {
            input.value = value;
            onInput();
        }
    }, [value, onInput]); // eslint-disable-line react-hooks/exhaustive-deps

    const placeholder = 'Paste a raw base64 encoded transaction message or Squads vault transaction account';
    return (
        <div className="card">
            <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                    <h3 className="card-header-title">Inspector Input</h3>
                    <button className="btn btn-sm btn-white" onClick={clearInput} type="button">
                        Clear
                    </button>
                </div>
            </div>
            <div className="card-body">
                <textarea
                    rows={rows}
                    onInput={onInput}
                    ref={rawInput}
                    className="form-control form-control-flush form-control-auto font-monospace"
                    placeholder={placeholder}
                    name="tx-inspector-input"
                ></textarea>
                <div className="row align-items-center">
                    <div className="col d-flex align-items-center">
                        {error && (
                            <>
                                <span className="text-warning small me-2">
                                    <i className="fe fe-alert-circle"></i>
                                </span>

                                <span className="text-warning">{error}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="card-footer">
                <h3>Instructions</h3>
                <TabInstructions />
            </div>
        </div>
    );
}
