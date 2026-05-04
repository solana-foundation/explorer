'use client';

import { Address } from '@components/common/Address';
import { Badge } from '@shared/ui/badge';
import { PublicKey } from '@solana/web3.js';
import { type ParsedTokenInstruction, TokenInstruction } from '@solana-program/token';

import { formatParsedInstruction } from '../lib/format-sub-instruction';
import type { DecodedField, DecodedParams, LabeledAccount } from '../lib/types';
import { useSubInstructionMintInfo } from '../model/use-sub-instruction-mint-info';

export function SubInstructionRow({
    parsed,
    extraSigners,
    index,
}: {
    parsed: ParsedTokenInstruction<string>;
    extraSigners: LabeledAccount[];
    index: number;
}) {
    const mintInfo = useSubInstructionMintInfo(parsed);
    const decoded = formatParsedInstruction(parsed, mintInfo, extraSigners);
    const typeName = TokenInstruction[parsed.instructionType] ?? 'Unknown';

    return (
        <div
            className="e-border-b e-border-neutral-200 e-py-3 dark:e-border-neutral-700"
            data-testid={`sub-ix-${index}`}
        >
            <div className="e-mb-2 e-flex e-items-center e-gap-2">
                <span className="badge bg-success-soft">#{index + 1}</span>
                <Badge variant="info" size="sm">
                    {typeName}
                </Badge>
            </div>

            {decoded && <DecodedContent decoded={decoded} />}
        </div>
    );
}

function DecodedContent({ decoded }: { decoded: DecodedParams }) {
    return (
        <div className="e-ml-6 e-space-y-1">
            {decoded.fields.map(field => (
                <FieldRow key={field.label} field={field} />
            ))}
            {decoded.accounts.map((account, i) => (
                <AccountRow key={i} account={account} />
            ))}
        </div>
    );
}

function FieldRow({ field }: { field: DecodedField }) {
    return (
        <div className="e-flex e-items-center e-gap-2 e-text-sm">
            <span className="e-min-w-[120px] e-text-neutral-500">{field.label}:</span>
            {field.isAddress ? (
                <Address pubkey={new PublicKey(field.value)} link truncateUnknown aria-label={field.value} />
            ) : (
                <span className="e-font-mono e-text-xs">{field.value}</span>
            )}
        </div>
    );
}

function AccountRow({ account }: { account: LabeledAccount }) {
    return (
        <div className="e-flex e-items-center e-gap-2 e-text-sm">
            <span className="e-min-w-[120px] e-text-neutral-500">{account.label}:</span>
            <Address pubkey={account.pubkey} link truncateUnknown />
            {account.isWritable && (
                <Badge variant="warning" size="xs">
                    Writable
                </Badge>
            )}
            {account.isSigner && (
                <Badge variant="success" size="xs">
                    Signer
                </Badge>
            )}
        </div>
    );
}
