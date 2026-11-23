import { getBase58Encoder } from '@solana/kit';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { MIN_MESSAGE_LENGTH, parseTransactionBytes } from '@/app/shared/lib/parse-transaction-bytes';
import { bridgeV1MessageBytes, isV1MessageBytes } from '@/app/shared/lib/v1-message-bridge';

import { BaseInspectorInput } from './BaseInspectorInput';
import { InspectorInstructions } from './InspectorInstructions';
import type { InspectorData, TransactionData } from './InspectorPage';

const BASE58_ENCODER = getBase58Encoder();

export { MIN_MESSAGE_LENGTH };

function getTransactionDataFromUserSuppliedBytes(bytes: Uint8Array): TransactionData {
    const { messageBytes, signatures } = parseTransactionBytes(bytes);
    if (isV1MessageBytes(messageBytes)) {
        const { message, transactionConfig } = bridgeV1MessageBytes(messageBytes);
        return {
            message,
            rawMessage: messageBytes,
            transactionConfig,
            version: 1,
            ...(signatures ? { signatures } : undefined),
        };
    }
    const message = VersionedMessage.deserialize(messageBytes);
    return {
        message,
        rawMessage: messageBytes,
        ...(signatures ? { signatures } : undefined),
    };
}

function parseAccountAddresses(input: string): string[] {
    // Split by commas, newlines, or spaces and filter out empty strings
    return (
        input
            // eslint-disable-next-line no-restricted-syntax -- split by whitespace and comma delimiters
            .split(/[\s,]+/)
            .map(addr => addr.trim())
            .filter(addr => addr.length > 0)
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
    const [hasValue, setHasValue] = React.useState(false);
    const currentPathname = usePathname();
    const currentSearchParams = useSearchParams();
    const router = useRouter();

    const onInput = React.useCallback(() => {
        const input = rawInput.current?.value;
        setHasValue(Boolean(input));
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

        try {
            // Try base58 decode, use result as Uint8Array
            buffer = new Uint8Array(BASE58_ENCODER.encode(input));
        } catch (_err) {
            // If base58 fails, try base64
            try {
                buffer = Uint8Array.from(atob(input), c => c.charCodeAt(0));
            } catch (err) {
                Logger.error(err);
                setError('Input must be base58/base64 encoded or a valid account address');
                return;
            }
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
            setHasValue(false);
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
        rawInput.current?.focus({ preventScroll: true });
    }, []);

    React.useEffect(() => {
        const input = rawInput.current;
        if (input && value) {
            input.value = value;
            onInput();
        }
    }, [value, onInput]);

    const placeholder = 'Paste a raw base58/base64 encoded transaction message or Squads vault transaction account';
    return (
        <>
            <BaseInspectorInput
                ref={rawInput}
                rows={rows}
                onInput={onInput}
                onClear={clearInput}
                hasValue={hasValue}
                error={error}
                placeholder={placeholder}
                name="tx-inspector-input"
            />
            <section className="flex flex-col pb-9">
                <InspectorInstructions />
            </section>
        </>
    );
}
