import type { PmpPayloadDecodeResult } from '@entities/pmp-account';
import { useMemo } from 'react';

import { isBinaryPayload } from '../../lib/config-resolution/resolve-buffer-config-from-bytes';
import { PayloadDocumentRow } from './PayloadDocumentRow';
import {
    PayloadEmptyRow,
    PayloadTooLargeRow,
    PayloadUndecodableRow,
    PayloadUnpackOverflowRow,
} from './PayloadNoteRows';
import { RawPayloadRow } from './RawPayloadRow';

/**
 * How a decoded payload renders, shared by both account kinds.
 *
 * Every arm is also exported on its own, because a card whose state reaches the same outcome through a DIFFERENT type
 * has to be able to render one row without coming through this switch.
 */
export function PayloadRows({ payload }: { payload: PmpPayloadDecodeResult }) {
    // Memoised because it is a full strict UTF-8 decode over up to `PMP_DECODED_RENDER_CAP_BYTES`, and this component
    // re-renders whenever the card above it does. Guarded on `decoded` so the arms that never ask pay nothing.
    const isBinary = useMemo(() => payload.kind === 'decoded' && isBinaryPayload(payload.bytes), [payload]);

    if (payload.kind === 'empty') return <PayloadEmptyRow />;

    if (payload.kind === 'failed') return <PayloadUndecodableRow reason={payload.reason} />;

    // The only arm with no bytes to offer: the unpack was abandoned mid-stream, so they were never produced.
    if (payload.kind === 'unpack-overflow') return <PayloadUnpackOverflowRow limit={payload.limit} />;

    // Past the decode budget, so there is no document - but the DECOMPRESSED bytes exist, which is exactly what
    // `oversized` carries them for. Offering them here beats pointing at the raw account bytes on the card above,
    // which are still compressed and are not what this alert is about.
    if (payload.kind === 'oversized') {
        return (
            <>
                <PayloadTooLargeRow budget={payload.budget} size={payload.bytes.length} />
                <RawPayloadRow bytes={payload.bytes} />
            </>
        );
    }

    // Bytes with no readable text form get the hex/base64 view rather than a document.
    if (isBinary) return <RawPayloadRow bytes={payload.bytes} />;

    return <PayloadDocumentRow text={payload.text} />;
}
