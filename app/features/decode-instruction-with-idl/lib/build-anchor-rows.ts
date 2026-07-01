import { AccountMeta, PublicKey } from '@solana/web3.js';
import { FlattenedIdlAccount } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';

// A single row of the Anchor account table: a collapsible group header, or an account (named from the
// IDL, or an unnamed "remaining" account). Split out of AnchorInstructionBody so the flatten + collapse
// logic is pure and unit-testable instead of an imperative IIFE in the render tree.
export type AnchorRow =
    | { kind: 'group'; id: string; name: string; nestingLevel: number }
    | {
          kind: 'account';
          keyIndex: number;
          pubkey: PublicKey;
          isSigner: boolean;
          isWritable: boolean;
          name: string;
          isNested: boolean;
          nestingLevel: number | undefined;
      };

// Interleave the instruction's on-chain accounts (`keys`, in order) with the IDL's account metadata
// (`ixAccounts`, which also carries group headers): one key per non-header IDL entry, headers emitted in
// place, and any keys beyond the named set rendered as "Remaining Account #N".
export function buildAnchorRows(keys: readonly AccountMeta[], ixAccounts: readonly FlattenedIdlAccount[]): AnchorRow[] {
    // The Nth on-chain key maps to the Nth non-header IDL entry.
    const namedByKeyIndex = new Map<number, FlattenedIdlAccount>();
    let namedCount = 0;
    for (const account of ixAccounts) {
        if (account.isGroupHeader) continue;
        namedByKeyIndex.set(namedCount, account);
        namedCount++;
    }

    const rows: AnchorRow[] = [];
    let cursor = 0; // position in ixAccounts; advances past group headers and each consumed named account

    keys.forEach(({ pubkey, isSigner, isWritable }, keyIndex) => {
        // Emit any group headers that precede this account.
        while (cursor < ixAccounts.length && ixAccounts[cursor].isGroupHeader) {
            const group = ixAccounts[cursor];
            const nestingLevel = group.nestingLevel ?? 0;
            rows.push({
                // Keyed by position in `ixAccounts` (stable for a given IDL, and unique even when two
                // sibling groups share a name+level — which name alone would collide on).
                id: `${cursor}:${group.name}`,
                kind: 'group',
                name: camelToTitleCase(group.name),
                nestingLevel,
            });
            cursor++;
        }

        const info = namedByKeyIndex.get(keyIndex);
        rows.push({
            isNested: info?.isNested ?? false,
            isSigner,
            isWritable,
            keyIndex,
            kind: 'account',
            name: info ? camelToTitleCase(info.name) : `Remaining Account #${keyIndex + 1 - namedCount}`,
            nestingLevel: info?.nestingLevel,
            pubkey,
        });
        cursor++;
    });

    return rows;
}

// Apply the collapse state: a collapsed group hides the rows nested beneath it (deeper `nestingLevel`)
// until the nesting returns to the group's level. Pure mirror of the former inline `skipUntilLevel` walk.
export function visibleAnchorRows(rows: readonly AnchorRow[], expandedGroups: ReadonlySet<string>): AnchorRow[] {
    const visible: AnchorRow[] = [];
    let skipUntilLevel: number | undefined;

    for (const row of rows) {
        if (row.kind === 'group') {
            skipUntilLevel = expandedGroups.has(row.id) ? undefined : row.nestingLevel;
            visible.push(row);
            continue;
        }
        // Accounts with no nesting level are never hidden (e.g. the self-CPI event authority).
        if (skipUntilLevel !== undefined && row.nestingLevel !== undefined && row.nestingLevel > skipUntilLevel) {
            continue;
        }
        if (skipUntilLevel !== undefined && row.nestingLevel !== undefined && row.nestingLevel <= skipUntilLevel) {
            skipUntilLevel = undefined;
        }
        visible.push(row);
    }

    return visible;
}
