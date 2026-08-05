// Ported from explorer-mcp's security-txt-parser (not @solana/security-txt) for exact wire parity.
import { getBase64Encoder, type ReadonlyUint8Array } from '@solana/kit';

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

export type SecurityTxtFields = {
    name: string;
    project_url: string;
    contacts: string;
    policy: string;
    preferred_languages: string | null;
    encryption: string | null;
    source_code: string | null;
    source_release: string | null;
    source_revision: string | null;
    auditors: string | null;
    acknowledgements: string | null;
    expiry: string | null;
};

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

function matchesAt(haystack: ReadonlyUint8Array, needle: Uint8Array, offset: number): boolean {
    for (let i = 0; i < needle.length; i++) {
        if (haystack[offset + i] !== needle[i]) {
            return false;
        }
    }
    return true;
}

function indexOfSequence(haystack: ReadonlyUint8Array, needle: Uint8Array): number {
    for (let i = 0; i + needle.length <= haystack.length; i++) {
        if (matchesAt(haystack, needle, i)) {
            return i;
        }
    }
    return -1;
}

export function parseSecurityTxt(dataBase64: string): ParseSecurityTxtResult {
    let decoded: ReadonlyUint8Array;
    try {
        decoded = getBase64Encoder().encode(dataBase64);
    } catch {
        // Buffer's lenient base64 path yielded marker-less bytes here; kit's strict encoder throws instead.
        return { error: 'no_markers', ok: false };
    }

    const utf8 = new TextEncoder();
    const headerBytes = utf8.encode(HEADER);
    const footerBytes = utf8.encode(FOOTER);

    const headerIdx = indexOfSequence(decoded, headerBytes);
    const footerIdx = indexOfSequence(decoded, footerBytes);
    if (headerIdx < 0 || footerIdx < 0) {
        return { error: 'no_markers', ok: false };
    }

    const content = decoded.subarray(headerIdx + headerBytes.length, footerIdx);

    const decoder = new TextDecoder();
    const tokens: string[] = [];
    let tokenStart = 0;
    for (let i = 0; i <= content.length; i++) {
        if (i === content.length || content[i] === 0) {
            tokens.push(decoder.decode(content.subarray(tokenStart, i)));
            tokenStart = i + 1;
        }
    }

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
