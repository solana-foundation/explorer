import type { PmpSecurityTXT } from './types';

export const NO_SECURITY_TXT_ERROR = 'Program has no security.txt';

export const PMP_SECURITY_TXT_DOC_LINK =
    'https://github.com/solana-program/program-metadata/tree/main?tab=readme-ov-file#securitytxt-file-format';

export const NEODYME_SECURITY_TXT_DOC_LINK = 'https://github.com/neodyme-labs/solana-security-txt';

export const PMP_SECURITY_TXT_KEYS: (keyof PmpSecurityTXT)[] = [
    'name',
    'logo',
    'description',
    'notification',
    'sdk',
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
    'version',
];
