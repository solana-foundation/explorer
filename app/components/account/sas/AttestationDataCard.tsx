import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import React from 'react';
import ReactJson from 'react-json-view';
import { Attestation as SasAttestation, decodeSchema, Schema as SasSchema } from 'sas-lib';

import {
    decodeAccount,
    decodeWithType,
    deserializeAttestationDataWithBorsh070,
    isAttestationAccount,
} from '@/app/utils/attestation-service';
import { mapToPublicKey } from '@/app/utils/kit-wrapper';

export function AttestationDataCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    if (!account || !isAttestationAccount(account)) {
        return onNotFound();
    }

    return <AttestationCard attestation={decodeAccount(account)?.data.data} />;
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
            decoded = deserializeAttestationDataWithBorsh070(schema, Uint8Array.from(attestation.data));
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h3 className="card-header-title">Attestation Data {decoded ? '' : 'Raw (Base64)'}</h3>
                    </div>
                </div>
            </div>

            {decoded ? (
                <div className="card metadata-json-viewer m-4">
                    <ReactJson src={decoded} theme={'solarized'} style={{ padding: 25 }} name={false} />
                </div>
            ) : (
                <div
                    className="font-monospace"
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
                    {Buffer.from(attestation.data).toString('base64') || '(empty)'}
                </div>
            )}
        </div>
    );
}
