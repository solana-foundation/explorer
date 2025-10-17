import { PublicKey } from '@solana/web3.js';

import type { NeodymeSecurityTXT, PmpSecurityTXT } from '../../lib/types';

export const programDataWithoutSecurityTxt = {
    authority: PublicKey.default,
    data: ['deadbeef', 'base64'] as [string, 'base64'],
    slot: 123,
};

export const securityTxtDataExample = {
    contacts: 'email:mail@mail.mail',
    name: 'NeodymeSecurityTXT',
    policy: 'policy',
    project_url: 'https://github.com',
};

export const programDataWithSecurityTxt = {
    authority: PublicKey.default,
    data: [encodeSecurityTxt(securityTxtDataExample), 'base64'] as [string, 'base64'],
    slot: 123,
};

export function encodeSecurityTxt(
    data: Pick<NeodymeSecurityTXT, 'name' | 'project_url' | 'contacts' | 'policy'>
): string {
    const HEADER = '=======BEGIN SECURITY.TXT V1=======\0';
    const FOOTER = '=======END SECURITY.TXT V1=======\0';

    // build key-value pairs separated by \0
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
        parts.push(k, v);
    }

    const content = parts.join('\0') + '\0';
    return Buffer.from(HEADER + content + FOOTER, 'utf8').toString('base64');
}

export function createPmpSecurityTxt(overrides: Partial<PmpSecurityTXT> = {}): PmpSecurityTXT {
    return {
        acknowledgements: 'Test Acknowledgements',
        auditors: 'Test Auditors',
        contacts: ['test@example.com'],
        description: 'Test Description',
        encryption: 'Test Encryption',
        expiry: 'Test Expiry',
        logo: 'https://example.com/logo.png',
        name: 'Test Program',
        notification: 'Test Notification',
        policy: 'Test Policy',
        preferred_languages: ['en'],
        project_url: 'https://example.com/project',
        sdk: 'Test SDK',
        source_code: 'Test Source Code',
        source_release: 'Test Source Release',
        source_revision: 'Test Source Revision',
        version: '1.0.0',
        ...overrides,
    };
}

export function createNeodymeSecurityTxt(overrides: Partial<NeodymeSecurityTXT> = {}): NeodymeSecurityTXT {
    return {
        contacts: 'test@example.com',
        name: 'Test Program',
        policy: 'Test Policy',
        project_url: 'https://example.com/project',
        ...overrides,
    };
}

export function createNeodymeSecurityTxtWithOptionalFields(
    overrides: Partial<NeodymeSecurityTXT> = {}
): NeodymeSecurityTXT {
    return {
        ...createNeodymeSecurityTxt(),
        acknowledgements: 'Test Acknowledgements',
        auditors: 'Test Auditors',
        encryption: 'pgp',
        expiry: '2025-12-31',
        preferred_languages: 'en',
        source_code: 'https://github.com/example/test',
        source_release: 'v1.0.0',
        source_revision: 'abc123',
        ...overrides,
    };
}
