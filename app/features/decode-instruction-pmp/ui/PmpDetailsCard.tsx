import { RawDataField } from '@components/shared/RawDataField';
import { DECODED_TABLE_COLUMNS, DecodedInstructionCard, toInstructionNode } from '@entities/instruction-card';
import { type TransactionInstruction } from '@solana/web3.js';
import { capitalizeFirstLetter } from '@utils/index';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Alert } from '@/app/shared/ui/Alert';
import { BaseTable } from '@/app/shared/ui/Table';

import { PMP_ACCOUNT_NAMES, PMP_IDL_PROGRAM_NAME, PMP_WRITE_CHUNK_DOWNLOAD_FILENAME } from '../lib/constants';
import { decodePmpContentInstruction } from '../lib/decode-pmp-instruction';
import { pmpArgs } from '../lib/pmp-args';
import type { PmpContentInstruction } from '../lib/types';
import { DataPayloadSection } from './DataPayloadSection';

type PmpDetailsCardProps = {
    ix: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
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
export function PmpDetailsCard(props: PmpDetailsCardProps) {
    return (
        <ErrorBoundary fallback={<>{props.fallback}</>}>
            <PmpDetailsCardBody {...props} />
        </ErrorBoundary>
    );
}

function PmpDetailsCardBody({ ix, index, innerCards, childIndex, fallback }: PmpDetailsCardProps) {
    const contentInstruction = React.useMemo(() => decodePmpContentInstruction(ix), [ix]);

    if (!contentInstruction) {
        return <>{fallback}</>;
    }

    const programName = capitalizeFirstLetter(PMP_IDL_PROGRAM_NAME);

    return (
        <DecodedInstructionCard
            node={toInstructionNode({ childIndex, index, innerCards, ix })}
            ix={ix}
            title={`${programName}: ${capitalizeFirstLetter(contentInstruction.kind)}`}
            programName={programName}
            accountNames={PMP_ACCOUNT_NAMES[contentInstruction.kind]}
            args={pmpArgs(contentInstruction)}
        >
            {contentInstruction.kind === 'write' ? (
                <WriteRows pmpIx={contentInstruction} />
            ) : (
                <DataPayloadSection pmpIx={contentInstruction} />
            )}
        </DecodedInstructionCard>
    );
}

/** `write` is a fragment with no hints, so it can never be decoded to a document on its own. */
function WriteRows({ pmpIx }: { pmpIx: Extract<PmpContentInstruction, { kind: 'write' }> }): React.ReactElement {
    const { chunk } = pmpIx;

    switch (chunk.kind) {
        case 'inline':
            return (
                <BaseTable.Row data-testid="pmp-write-chunk">
                    <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                        <div className="mb-1.5">chunk</div>
                        {/* A chunk runs to ~1 KB, so it gets the same field the raw payload does: hex/base64
                            tabs, byte count, copy, download and show-more, rather than a bare HexData grid. */}
                        <RawDataField data={chunk.bytes} filename={PMP_WRITE_CHUNK_DOWNLOAD_FILENAME} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        case 'account':
            return (
                <BaseTable.Row>
                    <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                        <Alert variant="default" data-testid="pmp-write-source-buffer" className="!mb-0">
                            The chunk was copied from the SourceBuffer account, so it is not in this instruction.
                        </Alert>
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        case 'absent':
            return (
                <BaseTable.Row>
                    <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                        <Alert variant="default" data-testid="pmp-write-absent-chunk" className="!mb-0">
                            This instruction carries no payload bytes.
                        </Alert>
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
    }
}
