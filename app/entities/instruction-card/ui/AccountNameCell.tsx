import React from 'react';
import { CornerDownRight } from 'react-feather';

import { BaseTable } from '@/app/shared/ui/Table';

import { AccountRoleBadges } from './AccountRoleBadges';

export function AccountNameCell({
    label,
    isSigner,
    isWritable,
    nested = false,
}: {
    label: string;
    isSigner: boolean;
    isWritable: boolean;
    nested?: boolean;
}) {
    return (
        <BaseTable.Cell>
            <div className="mr-1.5 md:inline">
                {nested && <CornerDownRight className="mb-[3px] mr-1.5 inline" size={14} />}
                {label}
            </div>
            <AccountRoleBadges isWritable={isWritable} isSigner={isSigner} />
        </BaseTable.Cell>
    );
}
