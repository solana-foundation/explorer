import { Idl } from '@coral-xyz/anchor';
import { ExpandToggleCell } from '@shared/ui/expandable-row';
import { TransactionInstruction } from '@solana/web3.js';
import { mapIxArgsToRows } from '@utils/anchor';
import { useMemo, useState } from 'react';
import { CornerDownRight } from 'react-feather';

import { Address } from '@/app/components/common/Address';
import { AccountRoleBadges } from '@/app/shared/ui/AccountRoleBadges';
import { BaseTable } from '@/app/shared/ui/Table';

import { type AnchorRow, buildAnchorRows, visibleAnchorRows } from '../lib/build-anchor-rows';
import { type AnchorInstructionDecoded, isFullyDecodedAnchorInstruction } from '../lib/decode-anchor-instruction';

export function AnchorInstructionBody({
    ix,
    idl,
    decoded,
}: {
    ix: TransactionInstruction;
    idl: Idl;
    decoded: AnchorInstructionDecoded;
}) {
    // Which groups the user has expanded; empty = all collapsed (the default). Keyed by stable group id
    // rather than array position, and never seeded from props, so it survives a re-decode.
    const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() => new Set<string>());

    // Flatten the IDL accounts + on-chain keys into a render plan once; collapse is applied on top.
    const { ixAccounts } = decoded;
    const rows = useMemo(() => (ixAccounts ? buildAnchorRows(ix.keys, ixAccounts) : []), [ix.keys, ixAccounts]);

    if (!isFullyDecodedAnchorInstruction(decoded)) {
        return (
            <BaseTable.Row>
                <BaseTable.Cell colSpan={3} className="lg:text-center">
                    Failed to decode account data according to the public Anchor interface
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    }

    const { decodedIxData, ixDef } = decoded;
    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <>
            <BaseTable.SectionRow>
                <BaseTable.Cell>Account Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    Address
                </BaseTable.Cell>
            </BaseTable.SectionRow>
            {visibleAnchorRows(rows, expandedGroups).map(row =>
                row.kind === 'group' ? (
                    <GroupHeaderRow
                        key={`group-${row.id}`}
                        row={row}
                        expanded={expandedGroups.has(row.id)}
                        onToggle={() => toggleGroup(row.id)}
                    />
                ) : (
                    <AccountRow key={row.keyIndex} row={row} />
                ),
            )}

            {ixDef.args.length > 0 && (
                <>
                    <BaseTable.SectionRow>
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                    </BaseTable.SectionRow>
                    {mapIxArgsToRows(decodedIxData.data, ixDef, idl)}
                </>
            )}
        </>
    );
}

function GroupHeaderRow({
    row,
    expanded,
    onToggle,
}: {
    row: Extract<AnchorRow, { kind: 'group' }>;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={2}>{row.name}</BaseTable.Cell>
            <ExpandToggleCell expanded={expanded} onToggle={onToggle} />
        </BaseTable.Row>
    );
}

function AccountRow({ row }: { row: Extract<AnchorRow, { kind: 'account' }> }) {
    return (
        <BaseTable.Row className={row.isNested ? 'bg-black/20' : ''}>
            <BaseTable.Cell>
                <div className="flex flex-row items-center">
                    {row.isNested && <CornerDownRight className="mb-[3px] mr-1.5" size={14} />}
                    <div className="mr-1.5 md:inline">{row.name}</div>
                    <AccountRoleBadges isWritable={row.isWritable} isSigner={row.isSigner} />
                </div>
            </BaseTable.Cell>
            <BaseTable.Cell className="text-right" colSpan={2}>
                <Address pubkey={row.pubkey} alignRight link />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
