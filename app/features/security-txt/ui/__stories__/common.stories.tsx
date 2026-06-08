import type { Meta, StoryObj } from '@storybook/react';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    CodeCell,
    ContactInfo,
    ExternalLinkCell,
    RenderCode,
    RenderExternalLink,
    SecurityTxtVersionBadge,
    SecurityTxtVersionBadgeTitle,
    StringCell,
} from '../common';

// Cells render <BaseTable.Cell>, so they need to live in a <table><BaseTable.Row> to be valid HTML.
const TableRowDecorator = (Story: () => React.ReactNode) => (
    <table>
        <BaseTable.Body>
            <BaseTable.Row>
                <BaseTable.Cell>Label</BaseTable.Cell>
                <Story />
            </BaseTable.Row>
        </BaseTable.Body>
    </table>
);

const meta = {
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
    title: 'Features/SecurityTxt/Common',
} satisfies Meta;

export default meta;

export const StringCellExample: StoryObj<typeof StringCell> = {
    args: { value: 'v1.2.3' },
    decorators: [TableRowDecorator],
    render: args => <StringCell {...args} />,
};

export const CodeCellAlignRight: StoryObj<typeof CodeCell> = {
    args: { alignRight: true, value: 'abc123def456' },
    decorators: [TableRowDecorator],
    render: args => <CodeCell {...args} />,
};

export const CodeCellAlignLeft: StoryObj<typeof CodeCell> = {
    args: { alignRight: false, value: 'abc123def456' },
    decorators: [TableRowDecorator],
    render: args => <CodeCell {...args} />,
};

export const ExternalLinkCellExample: StoryObj<typeof ExternalLinkCell> = {
    args: { url: 'https://example.com/security-policy' },
    decorators: [TableRowDecorator],
    render: args => <ExternalLinkCell {...args} />,
};

export const RenderExternalLinkExample: StoryObj<typeof RenderExternalLink> = {
    args: { url: 'https://example.com' },
    render: args => <RenderExternalLink {...args} />,
};

export const RenderCodeExample: StoryObj<typeof RenderCode> = {
    args: { value: '-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1\n…\n-----END PGP PUBLIC KEY BLOCK-----' },
    render: args => <RenderCode {...args} />,
};

export const ContactEmail: StoryObj<typeof ContactInfo> = {
    args: { information: 'security@example.com', type: 'email' },
    render: args => <ContactInfo {...args} />,
};

export const ContactDiscord: StoryObj<typeof ContactInfo> = {
    args: { information: 'Program#1234', type: 'discord' },
    render: args => <ContactInfo {...args} />,
};

export const ContactTwitter: StoryObj<typeof ContactInfo> = {
    args: { information: '@Program', type: 'twitter' },
    render: args => <ContactInfo {...args} />,
};

export const ContactTelegram: StoryObj<typeof ContactInfo> = {
    args: { information: 'program_chat', type: 'telegram' },
    render: args => <ContactInfo {...args} />,
};

export const ContactLink: StoryObj<typeof ContactInfo> = {
    args: { information: 'https://example.com/contact', type: 'link' },
    render: args => <ContactInfo {...args} />,
};

export const ContactOther: StoryObj<typeof ContactInfo> = {
    args: { information: 'support@example.com', type: 'custom' },
    render: args => <ContactInfo {...args} />,
};

export const VersionBadgeNeodyme: StoryObj<typeof SecurityTxtVersionBadge> = {
    args: { version: 'neodyme' },
    render: args => <SecurityTxtVersionBadge {...args} />,
};

export const VersionBadgePmp: StoryObj<typeof SecurityTxtVersionBadge> = {
    args: { version: 'pmp' },
    render: args => <SecurityTxtVersionBadge {...args} />,
};

export const VersionBadgeTitleOnly: StoryObj<typeof SecurityTxtVersionBadgeTitle> = {
    args: { version: 'pmp' },
    render: args => <SecurityTxtVersionBadgeTitle {...args} />,
};
