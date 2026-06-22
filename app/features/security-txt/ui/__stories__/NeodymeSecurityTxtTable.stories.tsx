import type { Meta, StoryObj } from '@storybook-config/types';

import type { NeodymeSecurityTXT } from '../../lib/types';
import { NeodymeSecurityTxtTable } from '../NeodymeSecurityTxtTable';

const fullData: NeodymeSecurityTXT = {
    acknowledgements: 'https://example.com/security-acknowledgements',
    auditors: 'Audit Firm A, Security Researcher B',
    contacts: 'email:security@example.com,discord:Program#1234,twitter:@Program,link:https://example.com/security',
    encryption: 'https://example.com/pgp-key.asc',
    expiry: '2026-12-31',
    name: 'Example Program',
    policy: 'https://example.com/security-policy',
    preferred_languages: 'en, de',
    project_url: 'https://github.com/solana-developers/',
    source_code: 'https://github.com/solana-developers/program',
    source_release: 'v0.1.0',
    source_revision: 'abc123def456',
};

const meta: Meta<typeof NeodymeSecurityTxtTable> = {
    component: NeodymeSecurityTxtTable,
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/NeodymeSecurityTxtTable',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
    args: { data: fullData },
};

export const MinimalRequired: Story = {
    args: {
        data: {
            contacts: 'email:security@example.com',
            name: 'Minimal Program',
            policy: 'https://example.com/policy',
            project_url: 'https://example.com',
        },
    },
};

export const InvalidUrls: Story = {
    args: {
        data: {
            ...fullData,
            policy: 'not-a-real-url',
            project_url: 'also-not-a-url',
        },
    },
};

export const InlinePgpBlock: Story = {
    args: {
        data: {
            ...fullData,
            encryption:
                '-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1\n\nmDMEXEcE6RYJKwYBBAHaRw8BAQdArjWwk3FAqyiFbFBKT4TzXcVBqPTB3gmzlC/U\n-----END PGP PUBLIC KEY BLOCK-----',
        },
    },
};
