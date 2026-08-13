import { Signature } from '@components/common/Signature';
import { decodeUnpackedPayload, type PmpAccountReadResult } from '@entities/pmp-account';
import { useMemo } from 'react';

import {
    type BufferConfigFromBytesPayload,
    hasPmpPayload,
} from '../lib/config-resolution/resolve-buffer-config-from-bytes';
import { BUFFER_CONFIG_FIELDS, BUFFER_HEADER_FIELDS } from '../lib/pmp-field-descriptors';
import { ConfigResolutionFromBytesState } from '../model/use-resolve-buffer-config-from-bytes';
import type { ConfigResolutionOnchainState } from '../model/use-resolve-buffer-config-onchain';
import {
    BasePmpAccountDataCard,
    FieldRows,
    InfoRow,
    NoteRow,
    PendingRow,
    PMP_CARD_TITLE,
} from './BasePmpAccountDataCard';
import {
    PayloadDocumentRow,
    PayloadRows,
    PayloadTooLargeRow,
    PayloadUnpackOverflowRow,
    RawPayloadRow,
} from './payload-rows';

export type BufferAccountRead = Extract<PmpAccountReadResult, { kind: 'buffer' }>;

export type BaseBufferAccountCardProps = {
    buffer: BufferAccountRead;
    configFromBytes: ConfigResolutionFromBytesState;
    configFromOnchain: ConfigResolutionOnchainState;
};

export function BaseBufferAccountCard({ configFromBytes, buffer, configFromOnchain }: BaseBufferAccountCardProps) {
    return (
        <BasePmpAccountDataCard title={`${PMP_CARD_TITLE}: Buffer`}>
            <BufferConfigResolutionNote configFromBytes={configFromBytes} configFromOnchain={configFromOnchain} />
            <FieldRows descriptors={BUFFER_HEADER_FIELDS} accountData={buffer} />
            <BufferDataContentRows configFromBytes={configFromBytes} configFromOnchain={configFromOnchain} />
        </BasePmpAccountDataCard>
    );
}

function BufferDataContentRows({
    configFromBytes,
    configFromOnchain,
}: {
    configFromBytes: ConfigResolutionFromBytesState;
    configFromOnchain: ConfigResolutionOnchainState;
}) {
    if (configFromBytes.status === 'idle') {
        return <PendingRow testId="pmp-account-detect-pending">Reading the buffer...</PendingRow>;
    }

    if (configFromBytes.status === 'failed') {
        return (
            <NoteRow testId="pmp-account-buffer-read-failed-note" variant="warning">
                Could not read this buffer.
            </NoteRow>
        );
    }

    const { result: resultFromBytes } = configFromBytes;

    if (resultFromBytes.kind === 'empty') {
        return (
            <NoteRow testId="pmp-account-buffer-empty-note" variant="default">
                This buffer is allocated but has not been written yet.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'incomplete') {
        return (
            <NoteRow testId="pmp-account-buffer-incomplete-note" variant="warning">
                The compressed stream is incomplete. Write chunks are still landing.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'unpack-error') {
        return (
            <NoteRow testId="pmp-account-buffer-unpack-error-note" variant="warning">
                Could not read config from Buffer bytes, error: {resultFromBytes.reason}.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'overflow') {
        return <PayloadUnpackOverflowRow limit={resultFromBytes.limit} />;
    }

    // The bytes here are the DECOMPRESSED payload, which is why they are worth offering rather than pointing at the
    // still-compressed account bytes on the card above.
    if (resultFromBytes.kind === 'oversized') {
        return (
            <>
                <PayloadTooLargeRow budget={resultFromBytes.budget} size={resultFromBytes.bytes.length} />
                <RawPayloadRow bytes={resultFromBytes.bytes} />
            </>
        );
    }

    const foundConfig = toFoundConfig(configFromOnchain);

    return (
        <>
            <FieldRows
                descriptors={BUFFER_CONFIG_FIELDS}
                accountData={{
                    compression: resultFromBytes.compression,
                    dataSource: foundConfig?.dataSource,
                    encoding: foundConfig?.config.encoding,
                    format:
                        foundConfig?.config.format ??
                        (resultFromBytes.kind === 'text' ? resultFromBytes.format : undefined),
                }}
            />
            <BufferPayloadRow foundConfig={foundConfig} fromBytesConfig={resultFromBytes} />
        </>
    );
}

/**
 * Where the Buffer's decode config came from.
 */
function BufferConfigResolutionNote({
    configFromBytes,
    configFromOnchain,
}: {
    configFromBytes: ConfigResolutionFromBytesState;
    configFromOnchain: ConfigResolutionOnchainState;
}) {
    if (configFromBytes.status !== 'ready') return undefined;
    if (!hasPmpPayload(configFromBytes.result)) return undefined;

    if (configFromOnchain.status === 'loading') {
        return <PendingRow testId="pmp-account-config-pending">Resolving config for decoding...</PendingRow>;
    }

    const lookup = configFromOnchain.status === 'ready' ? configFromOnchain.result : undefined;

    if (lookup?.kind === 'found-for-metadata-acc') {
        return (
            <InfoRow testId="pmp-account-buffer-copied-note">
                Config for decoding Buffer resolved from the Metadata account in transaction{' '}
                <InlineSignature signature={lookup.signature} />.
            </InfoRow>
        );
    }

    if (lookup?.kind === 'found-for-buffer-acc') {
        return (
            <InfoRow testId="pmp-account-buffer-declared-note">
                Config for decoding Buffer resolved from transaction <InlineSignature signature={lookup.signature} />.
            </InfoRow>
        );
    }

    if (lookup?.kind === 'failed') {
        return (
            <InfoRow testId="pmp-account-buffer-lookup-failed-note">
                Config for decoding Buffer resolved from bytes. Its transactions could not be checked for a declared
                config.
            </InfoRow>
        );
    }

    return <InfoRow testId="pmp-account-buffer-note">Config for decoding Buffer resolved from bytes.</InfoRow>;
}

/**
 * A text payload renders as a document. A binary one renders through `RawDataField`.
 *
 * When a declared config arrives it decodes the ALREADY-UNPACKED payload, so the body never inflates twice. That is
 * what lets a buffer holding readable YAML render as a base64 string once its `setData` declares `Base64`.
 */
function BufferPayloadRow({
    foundConfig,
    fromBytesConfig,
}: {
    foundConfig: ReturnType<typeof toFoundConfig>;
    fromBytesConfig: BufferConfigFromBytesPayload;
}) {
    const payload = useMemo(
        () => foundConfig && decodeUnpackedPayload({ bytes: fromBytesConfig.payload, config: foundConfig.config }),
        [foundConfig, fromBytesConfig],
    );

    if (payload) {
        return <PayloadRows payload={payload} />;
    }

    // Rendered as a document directly rather than through `PayloadRows`. The `text` arm was produced BY a strict UTF-8
    // decode of these very bytes, so the binary test inside `PayloadRows` would re-run a decode whose answer is known.
    if (fromBytesConfig.kind === 'text') {
        return <PayloadDocumentRow text={fromBytesConfig.text} />;
    }

    // The `binary` arm carries no text to hand `PayloadRows`, so it reaches the raw view directly.
    return <RawPayloadRow bytes={fromBytesConfig.payload} />;
}

/** Both arms carry a config the card can render with. They differ only in what the note is allowed to claim. */
function toFoundConfig(configFromOnchain: ConfigResolutionOnchainState) {
    if (configFromOnchain.status !== 'ready') return undefined;
    const { result } = configFromOnchain;
    return result.kind === 'found-for-buffer-acc' || result.kind === 'found-for-metadata-acc' ? result : undefined;
}

function InlineSignature({ signature }: { signature: string }) {
    return (
        <span>
            <Signature className="ml-1 inline-flex align-middle" link signature={signature} />
        </span>
    );
}
