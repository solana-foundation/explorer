import { cn } from '@shared/utils';
import type { Address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import React, { type ReactNode } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { KitAddress } from '../KitAddress';

type DetailRowProps = { label: string; pubkey: Address } | { label: string; children: ReactNode; monospace?: boolean };

export function DetailRow(props: DetailRowProps) {
    const monospace = !('pubkey' in props) && props.monospace;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{props.label}</BaseTable.Cell>
            <BaseTable.Cell className={cn('e-text-right', monospace && 'e-font-mono')}>
                {'pubkey' in props ? <KitAddress address={props.pubkey} alignRight link /> : props.children}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function StakeProgramRow() {
    return <DetailRow label="Program" pubkey={STAKE_PROGRAM_ADDRESS} />;
}
