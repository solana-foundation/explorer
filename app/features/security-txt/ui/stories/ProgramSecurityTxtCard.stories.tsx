import type { Meta, StoryObj } from '@storybook/react';

import { ProgramSecurityTxtCard } from '../SecurityCard';
import defaultSecurityTxtMock from './mocks/defaultSecurityTxt.json';

const meta = {
    component: ProgramSecurityTxtCard,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        backgrounds: {
            default: 'Card',
        },
        docs: {
            description: {
                story: 'Render security.txt Card',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/security/ProgramSecurityTxtCard',
} satisfies Meta<typeof ProgramSecurityTxtCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const NoSecurityTxt: Story = {
    args: {
        pmpSecurityTxt: undefined,
        programAddress: '11111111111111111111111111111111',
        programDataSecurityTxt: undefined,
    },
    parameters: {
        docs: {
            description: {
                story: 'Render security.txt empty message',
            },
        },
    },
};

export const ValidPmpSecurityTxt: Story = {
    args: {
        pmpSecurityTxt: defaultSecurityTxtMock,
        programAddress: '11111111111111111111111111111111',
        programDataSecurityTxt: undefined,
    },
    parameters: {
        docs: {
            description: {
                story: 'Render security.txt from PMP',
            },
        },
    },
};

export const InvalidPmpSecurityTxt: Story = {
    args: {
        pmpSecurityTxt: '123',
        programAddress: '11111111111111111111111111111111',
        programDataSecurityTxt: undefined,
    },
    parameters: {
        docs: {
            description: {
                story: 'Render security.txt error message',
            },
        },
    },
};

export const ValidProgramSecurityTxt: Story = {
    args: {
        pmpSecurityTxt: undefined,
        programAddress: '11111111111111111111111111111111',
        programDataSecurityTxt: {
            acknowledgements: 'acknowledgements',
            auditors: 'Auditor 1, https://auditor2.com',
            contacts: 'link:https://google.com,Discord:#d123,email:test@mail.com,othercontact',
            encryption: `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Alice's OpenPGP certificate
Comment: https://www.ietf.org/id/draft-bre-openpgp-samples-01.html

mDMEXEcE6RYJKwYBBAHaRw8BAQdArjWwk3FAqyiFbFBKT4TzXcVBqPTB3gmzlC/U
b7O1u120JkFsaWNlIExvdmVsYWNlIDxhbGljZUBvcGVucGdwLmV4YW1wbGU+iJAE
ExYIADgCGwMFCwkIBwIGFQoJCAsCBBYCAwECHgECF4AWIQTrhbtfozp14V6UTmPy
MVUMT0fjjgUCXaWfOgAKCRDyMVUMT0fjjukrAPoDnHBSogOmsHOsd9qGsiZpgRnO
dypvbm+QtXZqth9rvwD9HcDC0tC+PHAsO7OTh1S1TC9RiJsvawAfCPaQZoed8gK4
OARcRwTpEgorBgEEAZdVAQUBAQdAQv8GIa2rSTzgqbXCpDDYMiKRVitCsy203x3s
E9+eviIDAQgHiHgEGBYIACAWIQTrhbtfozp14V6UTmPyMVUMT0fjjgUCXEcE6QIb
DAAKCRDyMVUMT0fjjlnQAQDFHUs6TIcxrNTtEZFjUFm1M0PJ1Dng/cDW4xN80fsn
0QEA22Kr7VkCjeAEC08VSTeV+QFsmz55/lntWkwYWhmvOgE=
=iIGO
-----END PGP PUBLIC KEY BLOCK-----`,
            expiry: '2025-12-03',
            name: 'Test security.txt',
            policy: 'https://github.com/program/main/SECURITY.md',
            preferred_languages: 'en, de',
            project_url: 'https://github.com',
            source_code: 'https://github.com/123',
            source_release: 'v0.1.0',
            source_revision: 'abc',
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Render valid Program security.txt',
            },
        },
    },
};
