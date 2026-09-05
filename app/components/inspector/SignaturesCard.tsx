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
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

const BASE58_ENCODER = getBase58Encoder();

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

    const signatureRows = signatures.map((signature, index) => {
        const publicKey = message.staticAccountKeys[index];

        const props = {
            index,
            pending: verificationResults === undefined,
            signature,
            signer: publicKey,
            verified: verificationResults?.[index],
        };

        return <SignatureRow key={index} {...props} />;
    });

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Signatures
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-dk-gray-700">#</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Signature</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Signer</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Validity</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Details</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>{signatureRows}</BaseTable.Body>
            </BaseTable>
        </Card>
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

function SignatureRow({
    signature,
    signer,
    verified,
    pending,
    index,
}: {
    signature: string | undefined;
    signer: PublicKey;
    verified?: boolean;
    pending: boolean;
    index: number;
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <Badge ui="dashkit" variant="info" className="mr-[3px]">
                    {index + 1}
                </Badge>
            </BaseTable.Cell>
            <BaseTable.Cell>{signature ? <Signature signature={signature} /> : 'Missing Signature'}</BaseTable.Cell>
            <BaseTable.Cell>
                <Address pubkey={signer} link />
            </BaseTable.Cell>
            <BaseTable.Cell>{renderValidity(signature, verified, pending)}</BaseTable.Cell>
            <BaseTable.Cell>
                {index === 0 && (
                    <Badge ui="dashkit" variant="info" className="mr-[3px]">
                        Fee Payer
                    </Badge>
                )}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
