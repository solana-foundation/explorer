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
                <FieldNameCell name={fieldName} type={fieldType} nestingLevel={nestingLevel} />
                <TypeCell>{fieldType}</TypeCell>
                <ExpandToggleCell expanded={expanded} onToggle={() => setExpanded(current => !current)} />
            </BaseTable.Row>
            {expanded && children}
        </>
    );
}

export function FieldNameCell({ name, type, nestingLevel }: { name: string; type: string; nestingLevel: number }) {
    return (
        <BaseTable.Cell>
            <div className="flex flex-row items-baseline">
                {/* Below md the type adds a second line, so the arrow wrapper is one line tall. */}
                {nestingLevel > 0 && (
                    <span className="mr-1.5 flex h-[1lh] flex-none items-center self-start">
                        <CornerDownRight size={14} />
                    </span>
                )}
                {/* The type below md is CSS content, so the row text does not hold a second copy of the type. */}
                <div
                    data-type={type}
                    className="min-w-0 max-md:after:block max-md:after:italic max-md:after:content-[attr(data-type)]"
                >
                    {name}
                </div>
            </div>
        </BaseTable.Cell>
    );
}

// Below md the type shows under the field name. The cell stays in the row, so a `colSpan` in another row still lines up.
export function TypeCell({ children }: { children: React.ReactNode }) {
    return (
        <BaseTable.Cell className="max-md:!p-0">
            <span className="max-md:hidden">{children}</span>
        </BaseTable.Cell>
    );
}

export function ExpandToggleCell({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
    return (
        <BaseTable.Cell onClick={onToggle}>
            <div className="cursor-pointer">
                <span className="mr-1.5 text-dk-info">{expanded ? 'Collapse' : 'Expand'}</span>
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
        </BaseTable.Cell>
    );
}
