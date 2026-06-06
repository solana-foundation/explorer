import { Address } from '@components/common/Address';
import { Signature } from '@components/common/Signature';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import bs58 from 'bs58';
import React from 'react';
import * as nacl from 'tweetnacl';

import { Badge } from '@/app/components/shared/ui/badge';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function TransactionSignatures({
    signatures,
    message,
    rawMessage,
}: {
    signatures: (string | undefined)[];
    message: VersionedMessage;
    rawMessage: Uint8Array;
}) {
    const signatureRows = React.useMemo(() => {
        return signatures.map((signature, index) => {
            const publicKey = message.staticAccountKeys[index];

            let verified;
            if (signature) {
                const key = publicKey.toBytes();
                const rawSignature = bs58.decode(signature);
                verified = verifySignature({
                    key,
                    message: rawMessage,
                    signature: rawSignature,
                });
            }

            const props = {
                index,
                signature,
                signer: publicKey,
                verified,
            };

            return <SignatureRow key={publicKey.toBase58()} {...props} />;
        });
    }, [signatures, message, rawMessage]);

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Signatures
                </CardTitle>
            </CardHeader>
            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="e-text-dk-gray-700">#</th>
                            <th className="e-text-dk-gray-700">Signature</th>
                            <th className="e-text-dk-gray-700">Signer</th>
                            <th className="e-text-dk-gray-700">Validity</th>
                            <th className="e-text-dk-gray-700">Details</th>
                        </tr>
                    </thead>
                    <tbody className="list">{signatureRows}</tbody>
                </table>
            </div>
        </Card>
    );
}

function verifySignature({
    message,
    signature,
    key,
}: {
    message: Uint8Array;
    signature: Uint8Array;
    key: Uint8Array;
}): boolean {
    return nacl.sign.detached.verify(message, signature, key);
}

function SignatureRow({
    signature,
    signer,
    verified,
    index,
}: {
    signature: string | undefined;
    signer: PublicKey;
    verified?: boolean;
    index: number;
}) {
    return (
        <tr>
            <td>
                <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                    {index + 1}
                </Badge>
            </td>
            <td>{signature ? <Signature signature={signature} /> : 'Missing Signature'}</td>
            <td>
                <Address pubkey={signer} link />
            </td>
            <td>
                {verified === undefined ? (
                    'N/A'
                ) : verified ? (
                    <Badge ui="dashkit" variant="success" className="e-mr-[3px]">
                        Valid
                    </Badge>
                ) : (
                    <Badge ui="dashkit" variant="warning" className="e-mr-[3px]">
                        Invalid
                    </Badge>
                )}
            </td>
            <td>
                {index === 0 && (
                    <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                        Fee Payer
                    </Badge>
                )}
            </td>
        </tr>
    );
}
