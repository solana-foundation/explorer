import { Address } from '@components/common/Address';
import { cn } from '@shared/utils';
import { type PublicKey, StakeProgram } from '@solana/web3.js';
import React, { type ReactNode } from 'react';

type DetailRowProps =
    | { label: string; pubkey: PublicKey }
    | { label: string; children: ReactNode; monospace?: boolean };

export function DetailRow(props: DetailRowProps) {
    const monospace = !('pubkey' in props) && props.monospace;
    return (
        <tr>
            <td>{props.label}</td>
            <td className={cn('text-lg-end', monospace && 'font-monospace')}>
                {'pubkey' in props ? <Address pubkey={props.pubkey} alignRight link /> : props.children}
            </td>
        </tr>
    );
}

export function StakeProgramRow() {
    return <DetailRow label="Program" pubkey={StakeProgram.programId} />;
}
