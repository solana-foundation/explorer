import { RawDataField } from '@components/shared/RawDataField';
import {
    PMP_COMPRESSION_LABELS,
    PMP_DATA_SOURCE_LABELS,
    PMP_ENCODING_LABELS,
    PMP_FORMAT_LABELS,
} from '@entities/pmp-account';
import { PublicKey, type SignatureResult, type TransactionInstruction } from '@solana/web3.js';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Address } from '@/app/components/common/Address';
import { CodamaInstructionBody } from '@/app/components/instruction/codama/CodamaInstructionBody';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';
import { BaseTable } from '@/app/shared/ui/Table';

import {
    PMP_ACCOUNT_NAMES,
    PMP_CODAMA_PROGRAM_NAME,
    PMP_IX_TITLES,
    PMP_WRITE_CHUNK_DOWNLOAD_FILENAME,
} from '../lib/constants';
import { decodePmpContentInstruction } from '../lib/decode-pmp-instruction';
import type { PmpContentInstruction, PmpPayloadInstruction } from '../lib/types';
import { DataPayloadSection } from './DataPayloadSection';

/** The card table has three columns, matching DataPayloadSection's own constant. */
const CARD_TABLE_COLUMNS = 3;

type PmpDetailsCardProps = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: React.ReactNode[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
    /**
     * What to render when this instruction carries no decodable content, and the ErrorBoundary fallback. Each
     * surface builds it: the IDL card when an IDL resolved, its own Unknown card otherwise. Injected rather than
     * built here because `boundaries/dependencies` forbids this feature from importing
     * `@features/decode-instruction-with-idl`, and because it keeps the card free of IDL concepts entirely.
     */
    fallback: React.ReactNode;
};

/**
 * The single entry point for every Program Metadata Program instruction on both the tx page and the inspector.
 *
 * It is keyed on the program id rather than hung off `CodamaInstructionCard` for two reasons: a 4-byte
 * header-only `setData` never produces a Codama decode at all, and the whole Codama path is gated on runtime
 * PMP IDL resolution while the typed decoders this card uses ship with the installed library.
 *
 * `setData`, `initialize` and `write` get the custom render below. Everything else, including the six
 * housekeeping instructions, renders `fallback`, which is what those instructions got before this card existed.
 */
export function PmpDetailsCard({ fallback, ...props }: PmpDetailsCardProps) {
    return (
        <ErrorBoundary fallback={<>{fallback}</>}>
            <PmpDetailsCardBody {...props} fallback={fallback} />
        </ErrorBoundary>
    );
}

function PmpDetailsCardBody({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
    fallback,
}: PmpDetailsCardProps) {
    const content = React.useMemo(() => decodePmpContentInstruction(ix), [ix]);

    if (!content) {
        return <>{fallback}</>;
    }

    // `toKitInstruction` always returns an array, so no `?? []` is needed here.
    const kitIx = toKitInstruction(ix);

    return (
        <InstructionCardComponent
            title={`${PMP_CODAMA_PROGRAM_NAME}: ${PMP_IX_TITLES[content.kind]}`}
            ix={ix}
            index={index}
            result={result}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <CodamaInstructionBody
                programId={ix.programId}
                programName={PMP_CODAMA_PROGRAM_NAME}
                accounts={kitIx.accounts}
                accountNames={PMP_ACCOUNT_NAMES[content.kind]}
            />
            {content.kind === 'write' ? (
                <WriteRows content={content} />
            ) : (
                <>
                    <ConfigRows content={content} />
                    <DataPayloadSection content={content} />
                </>
            )}
        </InstructionCardComponent>
    );
}

/**
 * The decode hints, rendered from their library enums rather than as raw numbers.
 *
 * Every label lookup below is total, with no `Unknown (n)` fallback, because no unvalidated hint ever reaches
 * here: the 5+ byte shapes come through a generated decoder that rejects an out-of-range enum byte, and the
 * 4-byte header-only shape is narrowed by `PmpDecodeConfigStruct`. Both reject by falling through to the card's
 * `fallback` instead. Adding a library variant breaks the build at the label maps, which is the intent.
 */
function ConfigRows({ content }: { content: PmpPayloadInstruction }) {
    return (
        <>
            <ArgumentHeaderRow />
            {content.kind === 'initialize' && <ValueRow testId="pmp-config-seed" label="Seed" value={content.seed} />}
            <ValueRow
                testId="pmp-config-encoding"
                label="Encoding"
                value={PMP_ENCODING_LABELS[content.config.encoding]}
            />
            <ValueRow
                testId="pmp-config-compression"
                label="Compression"
                value={PMP_COMPRESSION_LABELS[content.config.compression]}
            />
            <ValueRow testId="pmp-config-format" label="Format" value={PMP_FORMAT_LABELS[content.config.format]} />
            {content.dataSource !== undefined && (
                <ValueRow
                    testId="pmp-config-data-source"
                    label="Data Source"
                    value={PMP_DATA_SOURCE_LABELS[content.dataSource]}
                />
            )}
        </>
    );
}

/** `write` is a fragment with no hints, so it can never be decoded to a document on its own. */
function WriteRows({ content }: { content: Extract<PmpContentInstruction, { kind: 'write' }> }) {
    return (
        <>
            <ArgumentHeaderRow />
            {/* The wire `offset` is LOGICAL, 0-based inside the payload. The 96-byte header offset is a raw
                account-slicing detail and must not be added here. */}
            <ValueRow testId="pmp-write-offset" label="Offset" value={String(content.offset)} />

            {content.chunk !== undefined && (
                <BaseTable.Row data-testid="pmp-write-chunk">
                    <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                        <div className="mb-1.5">Chunk</div>
                        {/* A chunk runs to ~1 KB, so it gets the same field the raw payload does: hex/base64
                            tabs, byte count, copy, download and show-more, rather than a bare HexData grid. */}
                        <RawDataField data={content.chunk} filename={PMP_WRITE_CHUNK_DOWNLOAD_FILENAME} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {content.chunk === undefined && content.sourceBuffer !== undefined && (
                <BaseTable.Row data-testid="pmp-write-source-buffer">
                    <BaseTable.Cell>Source Buffer</BaseTable.Cell>
                    <BaseTable.Cell colSpan={2} className="text-right">
                        <div className="flex flex-col items-end gap-1.5">
                            <Address pubkey={new PublicKey(content.sourceBuffer)} alignRight link />
                            <span className="text-xs text-neutral-500">
                                The chunk was copied from this buffer, so it is not in this instruction.
                            </span>
                        </div>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
        </>
    );
}

function ArgumentHeaderRow() {
    return (
        <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
            <BaseTable.Cell>Argument Name</BaseTable.Cell>
            <BaseTable.Cell className="text-right" colSpan={2}>
                Value
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

function ValueRow({ label, testId, value }: { label: string; testId: string; value: string }) {
    return (
        <BaseTable.Row data-testid={testId}>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell colSpan={2} className="text-right font-mono text-xs">
                {value}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
