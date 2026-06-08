import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { CornerDownRight } from 'react-feather';

import { Address } from '@/app/components/common/Address';
import { BaseTable } from '@/app/shared/ui/Table';
import { ExpandableRow } from '@/app/utils/anchor';

import { Copyable } from '../../common/Copyable';

export function mapCodamaIxArgsToRows(data: any, nestingLevel = 0) {
    return Object.entries(data).map(([key, value], index) => {
        if (key === '__kind' || key === 'discriminator' || key === '__option') {
            return null;
        }

        let type = 'unknown';

        const baseKey = `${nestingLevel}-${index}`;
        if (Array.isArray(value) || value instanceof Uint8Array) {
            type = `Array[${value.length}]`;
            return (
                <ExpandableRow
                    key={`${nestingLevel}-${index}`}
                    fieldName={key}
                    fieldType={type}
                    nestingLevel={nestingLevel}
                    data-testid={`ix-args-${baseKey}`}
                >
                    {(Array.isArray(value) ? value : Array.from(value)).map((item, i) => {
                        if (typeof item === 'object') {
                            return (
                                <React.Fragment key={`${baseKey}-${i}`}>
                                    {mapCodamaIxArgsToRows({ [`#${i}`]: item }, nestingLevel + 1)}
                                </React.Fragment>
                            );
                        }
                        return mapCodamaIxArgsToRows({ [`#${i}`]: item }, nestingLevel + 1);
                    })}
                </ExpandableRow>
            );
        }

        type = inferType(value);

        if (typeof value === 'object' && value !== null) {
            return (
                <ExpandableRow
                    key={baseKey}
                    fieldName={key}
                    fieldType={type}
                    nestingLevel={nestingLevel}
                    data-testid={`ix-args-${baseKey}`}
                >
                    {mapCodamaIxArgsToRows(value, nestingLevel + 1)}
                </ExpandableRow>
            );
        }

        let displayValue;
        if (type === 'pubkey') {
            displayValue = <Address pubkey={new PublicKey(value as string)} alignRight link />;
        } else if (type === 'string') {
            displayValue = (
                <BaseTable.Cell
                    className="e-text-right"
                    style={{
                        fontSize: '0.85rem',
                        lineHeight: '1.2',
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        wordBreak: 'break-all',
                    }}
                >
                    <Copyable text={value as string}>
                        <span className="font-monospace">{value as string}</span>
                    </Copyable>
                </BaseTable.Cell>
            );
        } else {
            displayValue = <>{String(value)}</>;
        }

        return (
            <BaseTable.Row
                key={baseKey}
                data-testid={`ix-args-${baseKey}`}
                className={nestingLevel > 0 ? 'table-nested-account' : ''}
            >
                <BaseTable.Cell>
                    <div className="e-flex e-flex-row e-items-center">
                        {nestingLevel > 0 && <CornerDownRight className="e-mb-[3px] e-mr-1.5" size={14} />}
                        <div>{key}</div>
                    </div>
                </BaseTable.Cell>
                <BaseTable.Cell>{type}</BaseTable.Cell>
                {type === 'string' ? (
                    <BaseTable.Cell
                        className="e-text-right"
                        style={{
                            fontSize: '0.85rem',
                            lineHeight: '1.2',
                            maxWidth: '100%',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            wordBreak: 'break-all',
                        }}
                    >
                        <Copyable text={value as string}>
                            <span className="font-monospace">{value as string}</span>
                        </Copyable>
                    </BaseTable.Cell>
                ) : (
                    <BaseTable.Cell className="e-text-right">{displayValue}</BaseTable.Cell>
                )}
            </BaseTable.Row>
        );
    });
}

function inferType(value: any) {
    if (value.__kind) {
        return value.__kind;
    } else if (value.__option) {
        return `Option(${value.__option})`;
    } else if (typeof value === 'string') {
        try {
            new PublicKey(value);
            return 'pubkey';
        } catch {
            return 'string';
        }
    } else if (typeof value === 'number') {
        return 'number';
    } else if (typeof value === 'bigint') {
        return 'bignum';
    } else {
        return typeof value;
    }
}
