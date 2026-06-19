import { KitAddress } from '@components/common/KitAddress';
import { cn } from '@components/shared/utils';
import type { Address } from '@solana/kit';
import { type ReactNode } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { VOTE_PROGRAM_ADDRESS } from '../../lib/constants';

export function VoteProgramRow() {
    return <DetailRow label="Program" pubkey={VOTE_PROGRAM_ADDRESS} />;
}

export function DetailHashRow({ label, hash }: { label: string; hash: string }) {
    return (
        <DetailRow label={label}>
            <pre className="mb-0 inline-block text-left">{hash}</pre>
        </DetailRow>
    );
}

type DetailRowProps = { label: string; pubkey: Address } | { label: string; children: ReactNode; monospace?: boolean };

export function DetailRow(props: DetailRowProps) {
    const monospace = !('pubkey' in props) && props.monospace;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{props.label}</BaseTable.Cell>
            <BaseTable.Cell className={cn('text-right', monospace && 'font-mono')}>
                {'pubkey' in props ? <KitAddress address={props.pubkey} alignRight link /> : props.children}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
