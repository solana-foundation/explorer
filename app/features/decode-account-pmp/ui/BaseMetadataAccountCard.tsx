import type { PmpAccountReadResult } from '@entities/pmp-account';

import { METADATA_CONFIG_FIELDS, METADATA_HEADER_FIELDS } from '../lib/pmp-field-descriptors';
import type { MetadataPayloadDecodeResult } from '../model/use-decode-metadata-payload';
import { BasePmpAccountDataCard, FieldRows, NoteRow, PendingRow, PMP_CARD_TITLE } from './BasePmpAccountDataCard';
import { PayloadRows } from './payload-rows';

export type MetadataAccountRead = Extract<PmpAccountReadResult, { kind: 'metadata' }>;

export type BaseMetadataAccountCardProps = {
    metadata: MetadataAccountRead;
    payload: MetadataPayloadDecodeResult;
};

export function BaseMetadataAccountCard({ payload, metadata }: BaseMetadataAccountCardProps) {
    return (
        <BasePmpAccountDataCard title={`${PMP_CARD_TITLE}: Metadata`}>
            <FieldRows descriptors={METADATA_HEADER_FIELDS} accountData={metadata} />
            <FieldRows descriptors={METADATA_CONFIG_FIELDS} accountData={metadata} />

            {/* `data` is a remainder, so it normally holds AT LEAST `dataLength`; holding less means the account
                was never filled to the length its header claims. */}
            {metadata.account.dataLength > metadata.account.data.length && (
                <NoteRow testId="pmp-account-truncated-note" variant="warning">
                    The header declares {metadata.account.dataLength} payload bytes but the account holds{' '}
                    {metadata.account.data.length}, so this account is truncated and its payload is likely incomplete.
                </NoteRow>
            )}

            <MetadataPayloadRow payloadResult={payload} />
        </BasePmpAccountDataCard>
    );
}

function MetadataPayloadRow({ payloadResult }: { payloadResult: MetadataPayloadDecodeResult }) {
    if (payloadResult.status === 'idle') {
        return <PendingRow testId="pmp-account-decoded-pending">Decoding...</PendingRow>;
    }

    if (payloadResult.status === 'failed') {
        return (
            <NoteRow testId="pmp-account-metadata-read-failed-note" variant="warning">
                Could not read this account.
            </NoteRow>
        );
    }

    return <PayloadRows payload={payloadResult.payload} />;
}
