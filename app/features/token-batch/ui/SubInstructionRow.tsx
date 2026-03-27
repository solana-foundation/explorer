'use client';

import { Address } from '@components/common/Address';
import { Badge } from '@shared/ui/badge';

import { toHex } from '@/app/shared/lib/bytes';

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
                <span className="e-text-sm e-font-medium e-text-neutral-500">#{subIx.index + 1}</span>
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
        <div className="e-ml-6">
            {decoded.fields.length > 0 && (
                <div className="e-mb-2">
                    {decoded.fields.map(field => (
                        <div key={field.label} className="e-flex e-gap-2 e-text-sm">
                            <span className="e-text-neutral-500">{field.label}:</span>
                            <span className="e-font-mono">{field.value}</span>
                        </div>
                    ))}
                </div>
            )}
            <AccountList accounts={decoded.accounts} />
        </div>
    );
}

function RawContent({ subIx }: { subIx: ParsedSubInstruction }) {
    const accounts = subIx.accounts.map((account, i) => ({ ...account, label: `Account ${i}` }));
    return (
        <div className="e-ml-6">
            <div className="e-mb-2 e-text-sm">
                <span className="e-text-neutral-500">Data: </span>
                <span className="e-break-all e-font-mono e-text-xs">{toHex(subIx.data)}</span>
            </div>
            <AccountList accounts={accounts} />
        </div>
    );
}

function AccountList({ accounts }: { accounts: LabeledAccount[] }) {
    return (
        <div className="e-space-y-1">
            {/* Index key: list is static/positional and pubkeys can be duplicated across accounts */}
            {accounts.map((account, i) => (
                <div key={i} className="e-flex e-items-center e-gap-2 e-text-sm">
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
            ))}
        </div>
    );
}
