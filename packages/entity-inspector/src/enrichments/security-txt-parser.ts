// Ported from explorer-mcp's security-txt-parser (not @solana/security-txt) for exact wire parity.
import type { SecurityTxtFields } from './types.js';

const HEADER = '=======BEGIN SECURITY.TXT V1=======\0';
const FOOTER = '=======END SECURITY.TXT V1=======\0';

const REQUIRED_KEYS = ['name', 'project_url', 'contacts', 'policy'] as const;
const VALID_KEYS: readonly string[] = [
    'name',
    'project_url',
    'contacts',
    'policy',
    'preferred_languages',
    'encryption',
    'source_code',
    'source_release',
    'source_revision',
    'auditors',
    'acknowledgements',
    'expiry',
];

export type ParseSecurityTxtResult =
    | { ok: true; fields: SecurityTxtFields }
    | { ok: false; error: 'no_markers' | 'invalid_content' };

type ValidatedSecurityMap = Record<string, string> & {
    name: string;
    project_url: string;
    contacts: string;
    policy: string;
};

function hasRequiredKeys(map: Record<string, string>): map is ValidatedSecurityMap {
    return REQUIRED_KEYS.every(k => k in map);
}

export function parseSecurityTxt(dataBase64: string): ParseSecurityTxtResult {
    const decoded = Buffer.from(dataBase64, 'base64');

    const headerIdx = decoded.indexOf(HEADER);
    const footerIdx = decoded.indexOf(FOOTER);
    if (headerIdx < 0 || footerIdx < 0) {
        return { error: 'no_markers', ok: false };
    }

    const content = decoded.subarray(headerIdx + HEADER.length, footerIdx);

    const tokens = content
        .reduce<number[][]>(
            (prev, current) => {
                if (current === 0) {
                    prev.push([]);
                } else {
                    prev[prev.length - 1]?.push(current);
                }
                return prev;
            },
            [[]],
        )
        .map(c => Buffer.from(c).toString());

    const map: Record<string, string> = {};
    for (let i = 0; i + 1 < tokens.length; i += 2) {
        const key = tokens[i];
        const value = tokens[i + 1];
        if (key && value !== undefined && VALID_KEYS.includes(key)) {
            map[key] = value;
        }
    }

    if (!hasRequiredKeys(map)) {
        return { error: 'invalid_content', ok: false };
    }

    return {
        fields: {
            acknowledgements: map.acknowledgements ?? null,
            auditors: map.auditors ?? null,
            contacts: map.contacts,
            encryption: map.encryption ?? null,
            expiry: map.expiry ?? null,
            name: map.name,
            policy: map.policy,
            preferred_languages: map.preferred_languages ?? null,
            project_url: map.project_url,
            source_code: map.source_code ?? null,
            source_release: map.source_release ?? null,
            source_revision: map.source_revision ?? null,
        },
        ok: true,
    };
}
