import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import React from 'react';
import {
    Attestation as SasAttestation,
    decodeSchema,
    deserializeAttestationData,
    Schema as SasSchema,
    SchemaDataType,
} from 'sas-lib';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { LoadingCard } from '@/app/components/common/LoadingCard';
import { toBase64, toHex } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { decodeAccount, decodeWithType, isAttestationAccount } from '@/app/utils/attestation-service';
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
    const layout = Object.fromEntries(schema.fieldNames.map((name, i) => [name, SchemaDataType[schema.layout[i]]]));
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Schema Layout
                </CardTitle>
            </CardHeader>

            {/* .string-value is emitted by the ReactJson library — the arbitrary variant scopes the break-all rule to its descendant nodes only. */}
            <Card ui="dashkit" className="m-6 [&_.string-value]:break-all">
                <ReactJson src={layout} style={{ padding: 25 }} name={false} />
            </Card>
        </Card>
    );
}

/**
 * `VecU8` fields hold binary blobs such as hashes, which decode to number
 * arrays and render as one row per byte. Hex keeps them readable and matches
 * how sas-lib surfaces the same content in a `String` field.
 */
function withByteFieldsAsHex(schema: SasSchema, data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        schema.fieldNames.map((name, index) => {
            const value = data[name];
            const isByteVector = schema.layout[index] === SchemaDataType.VecU8 && Array.isArray(value);
            return [name, isByteVector ? `0x${toHex(Uint8Array.from(value as number[]))}` : value];
        }),
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

    const isFetchingSchema = !schemaAccountInfo || schemaAccountInfo.status === FetchStatus.Fetching;
    if (isFetchingSchema) {
        return <LoadingCard message="Loading attestation data" />;
    }

    let decoded: any | null = null;
    try {
        if (schemaAccountInfo?.data) {
            const schema: SasSchema = decodeWithType(schemaAccountInfo.data, 'schema', decodeSchema)?.data.data;
            decoded = withByteFieldsAsHex(
                schema,
                deserializeAttestationData<Record<string, unknown>>(schema, Uint8Array.from(attestation.data)),
            );
        }
    } catch (e) {
        Logger.error(e);
    }

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Attestation Data {decoded ? '' : 'Raw (Base64)'}
                </CardTitle>
            </CardHeader>

            {decoded ? (
                // .string-value is emitted by the ReactJson library — the arbitrary variant scopes the break-all rule to its descendant nodes only.
                <Card ui="dashkit" className="m-6 [&_.string-value]:break-all">
                    <ReactJson src={decoded} style={{ padding: 25 }} name={false} />
                </Card>
            ) : (
                <div
                    className="font-mono"
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
        </Card>
    );
}
