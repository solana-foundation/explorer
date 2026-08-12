import { Signature } from '@components/common/Signature';
import { decodeUnpackedPayload, type PmpAccountReadResult } from '@entities/pmp-account';

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
import { DecodedContentRow, RawPayloadRow } from './PmpPayloadRows';

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
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Could not read this buffer. The decode failed.
            </NoteRow>
        );
    }

    const { result: resultFromBytes } = configFromBytes;

    if (resultFromBytes.kind === 'empty') {
        return (
            <NoteRow testId="pmp-account-empty-note" variant="default">
                This buffer is allocated but has not been written yet.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'incomplete') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                The compressed stream is incomplete, which is what a buffer looks like while its write chunks are still
                landing.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'overflow') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Payload expands past the {resultFromBytes.limit}-byte limit for unpacking.
            </NoteRow>
        );
    }

    if (resultFromBytes.kind === 'oversized') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Payload too large to render ({resultFromBytes.bytes.length} bytes, limit {resultFromBytes.budget}). The
                download menu above offers the raw account bytes; the decoded document is not available here.
            </NoteRow>
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
            <BufferDocumentRow foundConfig={foundConfig} fromBytesConfig={resultFromBytes} />
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

    // The lookup is in flight, so the detected provenance is about to be replaced by a stronger one. Rendering it
    // here would state a claim for a few hundred milliseconds and then contradict it, which reads as a glitch rather
    // than as progress. `skipped` does NOT land here: a certain detection resolves nothing further, so its note is
    // final and paints immediately.
    if (configFromOnchain.status === 'loading') {
        return <PendingRow testId="pmp-account-config-pending">Resolving config for decoding...</PendingRow>;
    }

    const lookup = configFromOnchain.status === 'ready' ? configFromOnchain.result : undefined;

    // `derived`, not `declared`: the config was stated for the metadata account this buffer's bytes were copied
    // into, not for the buffer. The transaction link is where a reader can see which account that was, so the
    // sentence stays short rather than naming it twice over.
    if (lookup?.kind === 'found-for-metadata-acc') {
        return (
            <InfoRow testId="pmp-account-buffer-copied-note">
                Config for decoding Buffer resolved from Metadata account from transaction{' '}
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
function BufferDocumentRow({
    foundConfig,
    fromBytesConfig,
}: {
    foundConfig: ReturnType<typeof toFoundConfig>;
    fromBytesConfig: BufferConfigFromBytesPayload;
}) {
    if (foundConfig) {
        return (
            <DecodedContentRow
                payload={decodeUnpackedPayload({ bytes: fromBytesConfig.payload, config: foundConfig.config })}
            />
        );
    }

    if (fromBytesConfig.kind === 'text') {
        return (
            <DecodedContentRow
                payload={{ bytes: fromBytesConfig.payload, kind: 'decoded', text: fromBytesConfig.text }}
            />
        );
    }

    // Detection's `binary` arm carries no text to hand `DecodedContentRow`, so it reaches the raw view directly.
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
