'use client';

import { BaseTable } from '@shared/ui/Table';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CornerDownRight } from 'react-feather';

export function ExpandableRow({
    fieldName,
    fieldType,
    nestingLevel,
    children,
    'data-testid': testId,
}: {
    fieldName: string;
    fieldType: string;
    nestingLevel: number;
    children: React.ReactNode;
    'data-testid'?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <BaseTable.Row data-testid={testId}>
                <FieldNameCell name={fieldName} nestingLevel={nestingLevel} />
                <BaseTable.Cell>{fieldType}</BaseTable.Cell>
                <ExpandToggleCell expanded={expanded} onToggle={() => setExpanded(current => !current)} />
            </BaseTable.Row>
            {expanded && children}
        </>
    );
}

export function FieldNameCell({ name, nestingLevel }: { name: string; nestingLevel: number }) {
    return (
        <BaseTable.Cell>
            <div className="flex flex-row items-center">
                {nestingLevel > 0 && <CornerDownRight className="mb-[3px] mr-1.5" size={14} />}
                <div>{name}</div>
            </div>
        </BaseTable.Cell>
    );
}

export function ExpandToggleCell({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
    return (
        <BaseTable.Cell className="text-right" onClick={onToggle}>
            <div className="cursor-pointer">
                <span className="mr-1.5 text-dk-info">{expanded ? 'Collapse' : 'Expand'}</span>
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
        </BaseTable.Cell>
    );
}
