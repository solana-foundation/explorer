'use client';

import { Address } from '@components/common/Address';
import { Badge } from '@shared/ui/badge';
import { PublicKey } from '@solana/web3.js';
import { type ParsedTokenInstruction, TokenInstruction } from '@solana-program/token';

import { formatParsedInstruction } from '../lib/format-sub-instruction';
import type { DecodedField, DecodedParams, LabeledAccount } from '../lib/types';
import { useSubInstructionMintInfo } from '../model/use-sub-instruction-mint-info';

// FIXME: missing Storybook story — needs useSubInstructionMintInfo (useAccountQuery chain) mocked.
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
        <div className="border-b border-neutral-700 py-3 last:border-b-0" data-testid={`sub-ix-${index}`}>
            <div className="mb-2 flex items-center gap-2">
                <Badge ui="dashkit" variant="success">
                    #{index + 1}
                </Badge>
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
        <div className="ml-6 space-y-1">
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
        <div className="flex items-center gap-2 text-sm">
            <span className="min-w-[120px] text-neutral-500">{field.label}:</span>
            {field.isAddress ? (
                <Address pubkey={new PublicKey(field.value)} link aria-label={field.value} />
            ) : (
                <span className="font-mono text-xs">{field.value}</span>
            )}
        </div>
    );
}

function AccountRow({ account }: { account: LabeledAccount }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="min-w-[120px] text-neutral-500">{account.label}:</span>
            <Address pubkey={account.pubkey} link />
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
