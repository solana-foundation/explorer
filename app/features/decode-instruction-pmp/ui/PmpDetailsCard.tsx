import { DecodedInstructionCard, type InstructionFieldList, type RawInstructionNode } from '@entities/instruction-card';
import type { Address } from '@solana/kit';
import type { DataSource } from '@solana-program/program-metadata';
import { capitalizeFirstLetter } from '@utils/index';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { PMP_ACCOUNT_NAMES, PMP_IDL_PROGRAM_NAME } from '../lib/constants';
import { decodePmpContentInstruction } from '../lib/decode-pmp-instruction';
import { pmpArgs } from '../lib/pmp-args';
import { accountPayloadFields, inlinePayloadFields, NO_PAYLOAD_FIELDS, writeFields } from '../lib/pmp-payload-fields';
import type { PmpContentInstruction, PmpPayloadInstruction } from '../lib/types';
import { usePmpAccountPayload } from '../model/use-pmp-account-payload';

type PmpDetailsCardProps = {
    node: RawInstructionNode;
    /**
     * What to render when this instruction carries no decodable content, and the ErrorBoundary fallback. The
     * instruction router builds it: the IDL card when an IDL resolved, the Unknown card otherwise. Injected rather than
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
 * `setData`, `initialize` and `write` get payload rows below their arguments. Everything else, including the six
 * housekeeping instructions, renders `fallback`, which is what those instructions got before this card existed.
 */
export function PmpDetailsCard(props: PmpDetailsCardProps) {
    return (
        <ErrorBoundary fallback={<>{props.fallback}</>}>
            <PmpDetailsCardBody {...props} />
        </ErrorBoundary>
    );
}

function PmpDetailsCardBody({ node, fallback }: PmpDetailsCardProps) {
    const contentInstruction = React.useMemo(() => decodePmpContentInstruction(node.raw), [node.raw]);

    if (!contentInstruction) {
        return <>{fallback}</>;
    }
    if (contentInstruction.kind === 'write') {
        return <PmpCard node={node} pmpIx={contentInstruction} fields={writeFields(contentInstruction.chunk)} />;
    }

    const { payload } = contentInstruction;
    switch (payload?.source.kind) {
        case 'inline':
            return (
                <InlinePayloadCard
                    node={node}
                    pmpIx={contentInstruction}
                    bytes={payload.source.bytes}
                    dataSource={payload.dataSource}
                />
            );
        case 'account':
            return (
                <AccountPayloadCard
                    node={node}
                    pmpIx={contentInstruction}
                    account={payload.source.account}
                    dataSource={payload.dataSource}
                />
            );
        default:
            return <PmpCard node={node} pmpIx={contentInstruction} fields={NO_PAYLOAD_FIELDS} />;
    }
}

function InlinePayloadCard({
    node,
    pmpIx,
    bytes,
    dataSource,
}: {
    node: RawInstructionNode;
    pmpIx: PmpPayloadInstruction;
    bytes: Uint8Array;
    dataSource: DataSource;
}) {
    const fields = React.useMemo(() => inlinePayloadFields({ bytes, dataSource, pmpIx }), [bytes, dataSource, pmpIx]);
    return <PmpCard node={node} pmpIx={pmpIx} fields={fields} />;
}

/** Reads the account that holds the payload, so only an instruction that points at one reads it. */
function AccountPayloadCard({
    node,
    pmpIx,
    account,
    dataSource,
}: {
    node: RawInstructionNode;
    pmpIx: PmpPayloadInstruction;
    account: Address;
    dataSource: DataSource;
}) {
    const state = usePmpAccountPayload({ address: account, config: pmpIx.config });
    const fields = React.useMemo(
        () => accountPayloadFields({ account, dataSource, pmpIx, state }),
        [account, dataSource, pmpIx, state],
    );
    return <PmpCard node={node} pmpIx={pmpIx} fields={fields} />;
}

function PmpCard({
    node,
    pmpIx,
    fields,
}: {
    node: RawInstructionNode;
    pmpIx: PmpContentInstruction;
    fields: InstructionFieldList;
}) {
    const programName = capitalizeFirstLetter(PMP_IDL_PROGRAM_NAME);

    return (
        <DecodedInstructionCard
            node={node}
            title={`${programName}: ${capitalizeFirstLetter(pmpIx.kind)}`}
            programName={programName}
            accountNames={PMP_ACCOUNT_NAMES[pmpIx.kind]}
            args={pmpArgs(pmpIx)}
            fields={fields}
        />
    );
}
