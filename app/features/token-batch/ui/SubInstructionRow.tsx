'use client';

import { Address } from '@components/common/Address';
import { HexData } from '@shared/HexData';
import { Badge } from '@shared/ui/badge';

import type { ParsedSubInstruction } from '../lib/batch-parser';
import { type DecodedParams, decodeSubInstructionParams, type LabeledAccount } from '../lib/decode-sub-instruction';
import { useSubInstructionMintInfo } from '../model/use-sub-instruction-mint-info';

export function SubInstructionRow({ subIx }: { subIx: ParsedSubInstruction }) {
    const mintInfo = useSubInstructionMintInfo(subIx.typeName, subIx.accounts);
    const decoded = decodeSubInstructionParams(subIx.typeName, subIx.data, subIx.accounts, mintInfo);

    return (
        <div
            className="e-border-b e-border-neutral-200 e-py-3 dark:e-border-neutral-700"
            data-testid={`sub-ix-${subIx.index}`}
        >
            <div className="e-mb-2 e-flex e-items-center e-gap-2">
                <span className="badge bg-success-soft">#{subIx.index + 1}</span>
                <Badge variant="info" size="sm">
                    {subIx.typeName}
                </Badge>
            </div>

            {decoded ? <DecodedContent decoded={decoded} /> : <RawContent subIx={subIx} />}
        </div>
    );
}

function DecodedContent({ decoded }: { decoded: DecodedParams }) {
    return (
        <div className="e-ml-6 e-space-y-1">
            {decoded.fields.map(field => (
                <div key={field.label} className="e-flex e-items-center e-gap-2 e-text-sm">
                    <span className="e-min-w-[120px] e-text-neutral-500">{field.label}:</span>
                    <span className="e-font-mono">{field.value}</span>
                </div>
            ))}
            {decoded.accounts.map((account, i) => (
                <AccountRow key={i} account={account} />
            ))}
        </div>
    );
}

function RawContent({ subIx }: { subIx: ParsedSubInstruction }) {
    const accounts = subIx.accounts.map((account, i) => ({ ...account, label: `Account ${i}` }));
    return (
        <div className="e-ml-6 e-space-y-1">
            <div className="e-flex e-items-center e-gap-2 e-text-sm">
                <span className="e-min-w-[120px] e-text-neutral-500">Data:</span>
                <HexData raw={subIx.data} truncate inverted />
            </div>
            {accounts.map((account, i) => (
                <AccountRow key={i} account={account} />
            ))}
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
