import { useMemo } from 'react';

import { TableCardBody } from '@/app/components/common/TableCardBody';

import { PMP_SECURITY_TXT_KEYS } from '../lib/constants';
import { CodeCell, ContactInfo, ExternalLinkCell, RenderCode, RenderExternalLink, StringCell } from './common';
import { isString, isValidLink, tryParseContactString } from './utils';

const CONTACT_TYPES = new Set(['discord', 'email', 'link', 'other', 'telegram', 'twitter']);

function parseContactList(value: string): [string, string][] {
    const parts = value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const parsed: [string, string][] = [];
    for (const part of parts) {
        const result = tryParseContactString(part);
        if (Array.isArray(result) && CONTACT_TYPES.has(result[0].toLowerCase())) {
            parsed.push([result[0], result[1]]);
        }
    }
    return parsed.length === parts.length ? parsed : [];
}

export function PmpSecurityTxtTable({ data }: { data: Record<string, any> }) {
    const entries = useMemo(() => {
        if (!(data instanceof Object)) {
            throw new Error('Invalid data');
        }
        // group main entries by PMP_SECURITY_TXT_KEYS
        return Object.entries(data).reduce(
            (acc, [key, value]) => {
                if ((PMP_SECURITY_TXT_KEYS as string[]).includes(key)) {
                    acc.main.push([key, value]);
                } else {
                    acc.additional.push([key, value]);
                }
                return acc;
            },
            { additional: [] as [string, any][], main: [] as [string, any][] },
        );
    }, [data]);

    return (
        <>
            <RenderTable entries={entries.main} />
            {entries.additional.length > 0 && (
                <>
                    <div className="card-header e-border-0 e-border-t e-border-solid e-border-t-[#282d2b]">
                        <h3 className="card-header-title">Additional:</h3>
                    </div>
                    <RenderTable entries={entries.additional} />
                </>
            )}
        </>
    );
}

function RenderTable({ entries }: { entries: [string, any][] }) {
    return (
        <TableCardBody>
            {entries.map(([entryKey, value], index) => {
                return (
                    <tr key={index}>
                        <td className="w-100">{entryKey}</td>
                        <RenderEntry key={entryKey} entryKey={entryKey} value={value} />
                    </tr>
                );
            })}
        </TableCardBody>
    );
}

function RenderEntry({ entryKey, value }: { entryKey: string; value: any }) {
    if (!value) {
        return displayEmptyValue(value);
    } else if (isValidLink(value)) {
        return displayLinkValue(value);
    } else if (isString(value)) {
        const contacts = parseContactList(value);
        if (contacts.length > 0) {
            return (
                <td className="text-lg-end font-monospace">
                    {contacts.map(([type, info], i) => (
                        <div key={i}>
                            <ContactInfo type={type} information={info} />
                        </div>
                    ))}
                </td>
            );
        }
        return displayStringValue(value);
    } else if (Array.isArray(value)) {
        return displayArrayValue(entryKey, value);
    } else if (!isNaN(value)) {
        return displayNumericValue(value);
    } else {
        return displayFallbackValue(value);
    }
}

function displayEmptyValue(value: null | undefined | '') {
    return <StringCell value={String(value)} />;
}

function displayLinkValue(value: string) {
    return <ExternalLinkCell url={value} />;
}

function displayStringValue(value: string) {
    if (value.includes('PGP') || value.includes('PUBLIC KEY')) {
        return <CodeCell value={value} alignRight={false} />;
    }
    return <StringCell value={value} />;
}

function displayArrayValue(entryKey: string, value: any[]) {
    return (
        <td className="font-monospace">
            <RenderList entryKey={entryKey} items={value} />
        </td>
    );
}

function displayNumericValue(value: number) {
    return <StringCell value={value.toString()} />;
}

function displayFallbackValue(value: any) {
    return <CodeCell value={value} alignRight />;
}

function RenderList({ entryKey, items }: { entryKey: string; items: any[] }) {
    return (
        <ul className="text-lg-end security-txt-list e-list-none e-pl-0 [&.security-txt-list]:e-text-left">
            {items.map((value, index) => {
                const elementKey = `${entryKey}-${index}`;
                if (!value) {
                    return <li key={elementKey}>-</li>;
                } else if (isValidLink(value)) {
                    return (
                        <li key={elementKey}>
                            <RenderExternalLink url={value} />
                        </li>
                    );
                } else if (isString(value)) {
                    const maybeContactStr = tryParseContactString(value);
                    if (Array.isArray(maybeContactStr)) {
                        return (
                            <li key={elementKey}>
                                <ContactInfo type={maybeContactStr[0]} information={maybeContactStr[1]} />
                            </li>
                        );
                    }
                    return <li key={elementKey}>{value}</li>;
                } else if (!isNaN(value)) {
                    return <li key={elementKey}>{value}</li>;
                }
                return (
                    <li key={elementKey}>
                        <RenderCode key={elementKey} value={value} />
                    </li>
                );
            })}
        </ul>
    );
}
