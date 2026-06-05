import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import React from 'react';
import {
    Attestation as SasAttestation,
    convertSasSchemaToBorshSchema,
    decodeSchema,
    Schema as SasSchema,
} from 'sas-lib';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { toBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { CardHeader, CardTitle } from '@/app/shared/ui/Card';
import {
    decodeAccount,
    decodeWithType,
    deserializeAttestationDataWithBorsh200,
    isAttestationAccount,
} from '@/app/utils/attestation-service';
import { mapToPublicKey } from '@/app/utils/kit-wrapper';

export function AttestationDataCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    if (!account || !isAttestationAccount(account)) {
        return onNotFound();
    }

    const decoded = decodeAccount(account);
    if (decoded?.type === 'attestation') {
        return <AttestationCard attestation={decoded.data.data} />;
    } else if (decoded?.type === 'schema') {
        return <SchemaCard schema={decoded.data.data} />;
    }

    return onNotFound();
}

function SchemaCard({ schema }: { schema: SasSchema }) {
    const borshSchema = convertSasSchemaToBorshSchema(schema);
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Schema Layout (Borsh)
                </CardTitle>
            </CardHeader>

            {/* .string-value is emitted by the ReactJson library — the arbitrary variant scopes the break-all rule to its descendant nodes only. */}
            <div className="card e-m-6 [&_.string-value]:e-break-all">
                <ReactJson src={borshSchema['schema']} style={{ padding: 25 }} name={false} />
            </div>
        </div>
    );
}

function AttestationCard({ attestation }: { attestation: SasAttestation }) {
    const schemaAccountInfo = useAccountInfo(mapToPublicKey(attestation.schema).toBase58());
    const fetchAccountInfo = useFetchAccountInfo();
    React.useEffect(() => {
        if (!schemaAccountInfo?.data) {
            fetchAccountInfo(mapToPublicKey(attestation.schema), 'parsed');
        }
    }, [schemaAccountInfo?.data, fetchAccountInfo, attestation.schema]);

    let decoded: any | null = null;
    try {
        if (schemaAccountInfo?.data) {
            const schema: SasSchema = decodeWithType(schemaAccountInfo.data, 'schema', decodeSchema)?.data.data;
            decoded = deserializeAttestationDataWithBorsh200(schema, Uint8Array.from(attestation.data));
        }
    } catch (e) {
        Logger.error(e);
    }

    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <div className="row e-items-center">
                    <div className="col">
                        <CardTitle as="h3" ui="dashkit">
                            Attestation Data {decoded ? '' : 'Raw (Base64)'}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>

            {decoded ? (
                // .string-value is emitted by the ReactJson library — the arbitrary variant scopes the break-all rule to its descendant nodes only.
                <div className="card e-m-6 [&_.string-value]:e-break-all">
                    <ReactJson src={decoded} style={{ padding: 25 }} name={false} />
                </div>
            ) : (
                <div
                    className="e-font-mono"
                    style={{
                        fontSize: '0.85rem',
                        lineHeight: '1.2',
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                        padding: '1rem',
                        whiteSpace: 'normal',
                        wordBreak: 'break-all',
                    }}
                >
                    {toBase64(new Uint8Array(attestation.data)) || '(empty)'}
                </div>
            )}
        </div>
    );
}
