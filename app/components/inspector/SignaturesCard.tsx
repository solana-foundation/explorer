import { Address } from '@components/common/Address';
import { Signature } from '@components/common/Signature';
import {
    getBase58Encoder,
    getPublicKeyFromAddress,
    isSolanaError,
    signatureBytes,
    SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH,
    verifySignature,
} from '@solana/kit';
import { type PublicKey, type VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

const BASE58_ENCODER = getBase58Encoder();

type SignatureRow = {
    index: number;
    pending: boolean;
    signature: string | undefined;
    signer: PublicKey;
    verified: boolean | undefined;
};

const COLUMNS: ReadonlyArray<GridTableColumn<SignatureRow>> = [
    {
        cellClassName: 'text-outer-space-300',
        header: '#',
        render: row => row.index + 1,
    },
    {
        header: 'Signature',
        render: row => (
            <div className="flex flex-col gap-1">
                <div>{row.signature ? <Signature signature={row.signature} /> : 'Missing Signature'}</div>
                <div>{renderValidity(row.signature, row.verified, row.pending)}</div>
            </div>
        ),
    },
    {
        header: 'Signer',
        render: row => (
            <div className="flex flex-col gap-1">
                <Address pubkey={row.signer} link />
                {row.index === 0 && (
                    <div>
                        <Badge ui="dashkit" variant="info" className="mr-[3px]">
                            Fee Payer
                        </Badge>
                    </div>
                )}
            </div>
        ),
    },
];

async function verifySignatures(
    signatures: (string | undefined)[],
    message: VersionedMessage,
    rawMessage: Uint8Array,
): Promise<(boolean | undefined)[]> {
    return await Promise.all(
        signatures.map(async (signature, index) => {
            if (!signature) return undefined;
            try {
                const publicKey = await getPublicKeyFromAddress(toKitAddress(message.staticAccountKeys[index]));
                const rawSignature = signatureBytes(new Uint8Array(BASE58_ENCODER.encode(signature)));
                return await verifySignature(publicKey, rawSignature, rawMessage);
            } catch (error) {
                return isSolanaError(error, SOLANA_ERROR__KEYS__INVALID_SIGNATURE_BYTE_LENGTH) ? false : undefined;
            }
        }),
    );
}

export function TransactionSignatures({
    signatures,
    message,
    rawMessage,
}: {
    signatures: (string | undefined)[];
    message: VersionedMessage;
    rawMessage: Uint8Array;
}) {
    const [verification, setVerification] = React.useState<{
        message: VersionedMessage;
        rawMessage: Uint8Array;
        results: (boolean | undefined)[];
        signatures: (string | undefined)[];
    }>();

    React.useEffect(() => {
        let cancelled = false;
        verifySignatures(signatures, message, rawMessage).then(results => {
            if (!cancelled) setVerification({ message, rawMessage, results, signatures });
        });
        return () => {
            cancelled = true;
        };
    }, [signatures, message, rawMessage]);

    const verificationResults =
        verification &&
        verification.signatures === signatures &&
        verification.message === message &&
        verification.rawMessage === rawMessage
            ? verification.results
            : undefined;

    const rows: SignatureRow[] = signatures.map((signature, index) => ({
        index,
        pending: verificationResults === undefined,
        signature,
        signer: message.staticAccountKeys[index],
        verified: verificationResults?.[index],
    }));

    return (
        <GridTableCard
            title="Signatures"
            ariaLabel="Signatures"
            gridTemplate="grid-cols-[auto_1fr_1fr]"
            columns={COLUMNS}
            rows={rows}
            getRowKey={row => row.index}
            empty="No signatures found"
            mobile="stack"
        />
    );
}

function renderValidity(
    signature: string | undefined,
    verified: boolean | undefined,
    pending: boolean,
): React.ReactNode {
    if (!signature) return 'N/A';
    if (pending) return undefined;
    if (verified === undefined) return 'N/A';
    return verified ? (
        <Badge ui="dashkit" variant="success" className="mr-[3px]">
            Valid
        </Badge>
    ) : (
        <Badge ui="dashkit" variant="warning" className="mr-[3px]">
            Invalid
        </Badge>
    );
}
