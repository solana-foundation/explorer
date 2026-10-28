import { makeProgramDataInfo } from '@entities/account/__fixtures__/account';
import type { NeodymeSecurityTxtFields, SecurityTxtFields } from '@solana/security-txt';

import type { ResolvedSecurityTxt } from '../../model/useSecurityTxt';

// Minimal programData fixture for `SecurityCard`'s `data.programData` guard — its bytes are no longer
// parsed (security.txt now resolves via `@solana/security-txt`), so the content is arbitrary.
export const programDataFixture = makeProgramDataInfo();

// TODO: rebuild these on `gen.securityTxt` (@__fixtures__/gen) so there's one security.txt fixture source.
export function createPmpSecurityTxt(fields: Partial<SecurityTxtFields> = {}): ResolvedSecurityTxt {
    return {
        fields: {
            acknowledgements: 'Test Acknowledgements',
            auditors: 'Test Auditors',
            contacts: 'test@example.com',
            description: 'Test Description',
            encryption: 'Test Encryption',
            expiry: 'Test Expiry',
            logo: 'https://example.com/logo.png',
            name: 'Test Program',
            notification: 'Test Notification',
            policy: 'Test Policy',
            preferred_languages: 'en',
            project_url: 'https://example.com/project',
            sdk: 'Test SDK',
            source_code: 'Test Source Code',
            source_release: 'Test Source Release',
            source_revision: 'Test Source Revision',
            version: '1.0.0',
            ...fields,
        },
        type: 'pmp',
    };
}

export function createNeodymeSecurityTxt(fields: Partial<NeodymeSecurityTxtFields> = {}): ResolvedSecurityTxt {
    return {
        fields: {
            contacts: 'test@example.com',
            name: 'Test Program',
            policy: 'Test Policy',
            project_url: 'https://example.com/project',
            ...fields,
        },
        type: 'elf',
    };
}
