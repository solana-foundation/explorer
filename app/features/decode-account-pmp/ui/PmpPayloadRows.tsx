import { Copyable } from '@components/common/Copyable';
import { RawDataField } from '@components/shared/RawDataField';
import type { PmpPayloadDecodeResult } from '@entities/pmp-account';

import { BaseTable } from '@/app/shared/ui/Table';

import { isBinaryPayload } from '../lib/config-resolution/resolve-buffer-config-from-bytes';
import { CARD_TABLE_COLUMNS, NoteRow } from './BasePmpAccountDataCard';

const PMP_PAYLOAD_DOWNLOAD_FILENAME = 'pmp-account-payload';

/**
 * How a decoded payload renders, shared by both account kinds.
 */
export function DecodedContentRow({ payload }: { payload: PmpPayloadDecodeResult }) {
    if (payload.kind === 'empty') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="default">
                The payload is empty.
            </NoteRow>
        );
    }

    if (payload.kind === 'failed') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Could not decode this payload: {payload.reason}
            </NoteRow>
        );
    }

    if (payload.kind === 'oversized') {
        // Past the decode budget, so there is no document - but the DECOMPRESSED bytes exist, which is exactly what
        // `oversized` carries them for. Offering them here beats pointing at the raw account bytes on the card
        // above, which are still compressed and are not what this alert is about.
        return (
            <>
                <NoteRow testId="pmp-account-decode-error" variant="warning">
                    Payload too large to render ({payload.bytes.length} bytes, limit {payload.budget}). Copy or download
                    it instead.
                </NoteRow>
                <RawPayloadRow bytes={payload.bytes} />
            </>
        );
    }

    if (payload.kind === 'unpack-overflow') {
        // The only arm with no bytes to offer: the unpack was abandoned mid-stream, so they were never produced.
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Payload expands past the {payload.limit}-byte limit for unpacking.
            </NoteRow>
        );
    }

    // Bytes with no readable text form get the hex/base64 view rather than a document.
    if (isBinaryPayload(payload.bytes)) {
        return <RawPayloadRow bytes={payload.bytes} />;
    }

    // Plain text for all formats: json, yaml, toml.
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                <div className="relative">
                    <div className="absolute right-2 top-2 z-10" data-testid="pmp-account-document-copy">
                        <Copyable text={payload.text} />
                    </div>
                    <pre
                        data-testid="pmp-account-document"
                        className="mb-0 max-h-80 overflow-auto whitespace-pre-wrap bg-heavy-metal-900 p-3 pr-8 text-left text-xs [overflow-wrap:anywhere]"
                    >
                        {payload.text}
                    </pre>
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

/**
 * Bytes with no readable document form.
 */
export function RawPayloadRow({ bytes }: { bytes: Uint8Array }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                <div data-testid="pmp-account-raw">
                    <RawDataField data={bytes} filename={PMP_PAYLOAD_DOWNLOAD_FILENAME} />
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
