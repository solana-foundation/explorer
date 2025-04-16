import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { CornerDownRight } from 'react-feather';

import { Address } from '@/app/components/common/Address';
import { ExpandableRow } from '@/app/utils/anchor';

import { Copyable } from '../../common/Copyable';

export function mapCodamaIxArgsToRows(data: any, nestingLevel = 0) {
    return Object.entries(data).map(([key, value], index) => {
        if (key === '__kind' || key === 'discriminator' || key === '__option') {
            return null;
        }

        let type = 'unknown';

        const baseKey = `${nestingLevel}-${index}`;
        if (Array.isArray(value)) {
            type = `Array[${value.length}]`;
            return (
                <ExpandableRow
                    key={`${nestingLevel}-${index}`}
                    fieldName={key}
                    fieldType={type}
                    nestingLevel={nestingLevel}
                    data-testid={`ix-args-${baseKey}`}
                >
                    {value.map((item, i) => {
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
                <td
                    className="text-lg-end"
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
                </td>
            );
        } else {
            displayValue = <>{String(value)}</>;
        }

        return (
            <tr key={baseKey} data-testid={`ix-args-${baseKey}`}>
                <td>
                    <div className="d-flex flex-row">
                        {nestingLevel > 0 && (
                            <span style={{ paddingLeft: `${15 * nestingLevel}px` }}>
                                <CornerDownRight className="me-2" size={15} />
                            </span>
                        )}
                        <div>{key}</div>
                    </div>
                </td>
                <td>{type}</td>
                {type === 'string' ? (
                    <td
                        className="text-lg-end"
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
                    </td>
                ) : (
                    <td className="text-lg-end">{displayValue}</td>
                )}
            </tr>
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
