import { cn } from '@shared/utils';
import type { Address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import React, { type ReactNode } from 'react';

import { KitAddress } from '../KitAddress';

type DetailRowProps = { label: string; pubkey: Address } | { label: string; children: ReactNode; monospace?: boolean };

export function DetailRow(props: DetailRowProps) {
    const monospace = !('pubkey' in props) && props.monospace;
    return (
        <tr>
            <td>{props.label}</td>
            <td className={cn('e-text-right', monospace && 'font-monospace')}>
                {'pubkey' in props ? <KitAddress address={props.pubkey} alignRight link /> : props.children}
            </td>
        </tr>
    );
}

export function StakeProgramRow() {
    return <DetailRow label="Program" pubkey={STAKE_PROGRAM_ADDRESS} />;
}
