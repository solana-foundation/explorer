import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { type PmpAccountHeader, type PmpDecodedPayload } from '@entities/pmp-account';
import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { camelToTitleCase } from '@utils/index';
import React from 'react';
import { Loader } from 'react-feather';

import { Alert } from '@/app/shared/ui/Alert';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import {
    BUFFER_HEADER_FIELDS,
    type FieldDescriptor,
    FieldType,
    METADATA_CONFIG_FIELDS,
    METADATA_HEADER_FIELDS,
} from '../lib/pmp-field-descriptors';
import type { PmpDecodeState } from '../model/use-decode-pmp-payload';

/** The card table is two columns, so a full-width row spans both. */
const CARD_TABLE_COLUMNS = 2;

/** Mirrors the SAS card's `Solana Attestation Service: Attestation` shape, which is the account-card convention. */
const CARD_TITLE = 'Program Metadata';

/** `absent` and `unreadable` fall back to the bare title, because neither one has a layout to name. */
const KIND_TITLES: Partial<Record<PmpAccountHeader['kind'], string>> = {
    buffer: `${CARD_TITLE}: Buffer`,
    empty: `${CARD_TITLE}: Empty`,
    metadata: `${CARD_TITLE}: Metadata`,
};

export type BasePmpAccountCardProps = {
    account: Account;
    header: PmpAccountHeader;
    decodedState: PmpDecodeState;
};

export function BasePmpAccountCard({ decodedState, header }: BasePmpAccountCardProps) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    {KIND_TITLES[header.kind] ?? CARD_TITLE}
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                {/* A `tbody` is required: rows placed directly under `table` make React warn about invalid DOM
                    nesting and would mismatch on hydration, since the browser inserts one anyway. */}
                <BaseTable.Body>
                    <PmpHeaderRows header={header} />
                    {header.kind === 'metadata' && (
                        <PmpMetadataContentRows decodedState={decodedState} header={header} />
                    )}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

/**
 * The kinds do not share a field list. A Buffer header has no `mutable` byte, and its program/canonical/seed are
 * written only for a PDA buffer - a keypair buffer showing `Program: 11111...111` and an empty seed would be
 * inventing fields the account does not have.
 *
 * Address, balance, allocated size and executable are deliberately absent: the card above this tab shows them.
 */
function PmpHeaderRows({ header }: { header: PmpAccountHeader }) {
    return (
        <>
            {header.kind === 'metadata' && <FieldRows descriptors={METADATA_HEADER_FIELDS} header={header} />}

            {header.kind === 'buffer' && (
                <>
                    <FieldRows descriptors={BUFFER_HEADER_FIELDS} header={header} />
                    {/* Four of the six real example accounts are Buffers, so this has to read as a deliberate,
                        informative state rather than as a failure. */}
                    <NoteRow testId="pmp-account-buffer-note" variant="default">
                        A Buffer account stores no encoding, compression or format, so its payload cannot be decoded
                        from the account alone.
                    </NoteRow>
                </>
            )}

            {header.kind === 'empty' && (
                <NoteRow testId="pmp-account-empty-note" variant="default">
                    This account is allocated but has not been written yet.
                </NoteRow>
            )}

            {(header.kind === 'absent' || header.kind === 'unreadable') && (
                <NoteRow testId="pmp-account-unreadable-note" variant="warning">
                    Could not read this Program Metadata account
                    {header.kind === 'unreadable' ? `: ${header.reason}` : ''}.
                </NoteRow>
            )}
        </>
    );
}

/**
 * The config rows come from the header, which was read on mount, so they render while the payload decode is still
 * running. They live with the document rather than in the header block above because they ARE the decode hints.
 */
function PmpMetadataContentRows({
    decodedState,
    header,
}: {
    decodedState: PmpDecodeState;
    header: Extract<PmpAccountHeader, { kind: 'metadata' }>;
}) {
    return (
        <>
            <FieldRows descriptors={METADATA_CONFIG_FIELDS} header={header} />

            {/* `data` is a remainder, so it normally holds AT LEAST `dataLength`; holding less means the account
                was never filled to the length its header claims. */}
            {header.account.dataLength > header.account.data.length && (
                <NoteRow testId="pmp-account-truncated-note" variant="warning">
                    The header declares {header.account.dataLength} payload bytes but the account holds{' '}
                    {header.account.data.length}, so this account is truncated and its payload is likely incomplete.
                </NoteRow>
            )}

            <DocumentRow decodedState={decodedState} />
        </>
    );
}

function DocumentRow({ decodedState }: { decodedState: PmpDecodeState }) {
    if (decodedState.status === 'idle') {
        return (
            <BaseTable.Row>
                <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                    <span
                        data-testid="pmp-account-decoded-pending"
                        className="flex items-center gap-2 text-xs text-neutral-500"
                    >
                        <Loader size={12} className="animate-spin" />
                        Decoding...
                    </span>
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    }

    if (decodedState.status === 'failed') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Could not read this account. The decode failed.
            </NoteRow>
        );
    }

    return <DecodedContentRow payload={decodedState.payload} />;
}

/**
 * Every non-document outcome renders as its own warning/info note.
 * `decodePmpPayload` never throws, so a failure degrades to the header rows plus a note.
 */
function DecodedContentRow({ payload }: { payload: PmpDecodedPayload }) {
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
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Payload too large to render ({payload.bytes.length} bytes, limit {payload.budget}). The download menu
                above offers the raw account bytes; the decoded document is not available here.
            </NoteRow>
        );
    }

    if (payload.kind === 'unpack-overflow') {
        return (
            <NoteRow testId="pmp-account-decode-error" variant="warning">
                Payload expands past the {payload.limit}-byte limit for unpacking.
            </NoteRow>
        );
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
                        className="mb-0 max-h-80 overflow-auto whitespace-pre-wrap break-words bg-heavy-metal-900 p-3 pr-8 text-left text-xs"
                    >
                        {payload.text}
                    </pre>
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

/**
 * Renders a descriptor list.
 */
function FieldRows<H>({ descriptors, header }: { descriptors: FieldDescriptor<H>[]; header: H }) {
    return (
        <>
            {descriptors.map(descriptor => {
                if (descriptor.when && !descriptor.when(header)) return undefined;

                const value = descriptor.value(header);

                // One flat testid namespace: PMP's account field names are unique across both descriptor lists, so
                // a row is `pmp-account-${field}` and matches the IDL's own field name exactly, as the label does.
                return (
                    <BaseTable.Row data-testid={`pmp-account-${descriptor.field}`} key={descriptor.field}>
                        <BaseTable.Cell>{camelToTitleCase(descriptor.field)}</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {value === undefined ? 'None' : <FieldValue type={descriptor.type} value={value} />}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            })}
        </>
    );
}

function NoteRow({
    children,
    testId,
    variant,
}: {
    children: React.ReactNode;
    testId: string;
    variant: 'default' | 'warning';
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell className="whitespace-normal" colSpan={CARD_TABLE_COLUMNS}>
                <Alert variant={variant} data-testid={testId} className="!mb-0">
                    {children}
                </Alert>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function FieldValue({ type, value }: { type: FieldType; value: boolean | string }): React.ReactNode {
    if (type === 'pubkey') return <Address pubkey={new PublicKey(String(value))} alignRight link raw />;
    if (type === 'bool') return value ? 'Yes' : 'No';
    return String(value);
}
