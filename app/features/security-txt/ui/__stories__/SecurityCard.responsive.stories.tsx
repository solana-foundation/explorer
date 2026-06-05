import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { toBase64 } from '@/app/shared/lib/bytes';

import { SecurityCard } from '../SecurityCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const PUBKEY = TOKEN_PROGRAM_ID;
const AUTHORITY = PublicKey.default;

const NEODYME_HEADER = '=======BEGIN SECURITY.TXT V1=======\0';
const NEODYME_FOOTER = '=======END SECURITY.TXT V1=======\0';

function encodeNeodymeSecurityTxt(fields: Record<string, string>): string {
    const enc = new TextEncoder();
    const body = `${Object.entries(fields)
        .flatMap(([k, v]) => [k, v])
        .join('\0')}\0`;
    const bytes = enc.encode(`${NEODYME_HEADER}${body}${NEODYME_FOOTER}`);
    return toBase64(bytes);
}

const validSecurityTxt = encodeNeodymeSecurityTxt({
    auditors: 'Sample Auditor',
    contacts: 'email:security@example.test,link:https://example.test/security',
    name: 'Sample Program',
    policy: 'https://example.test/SECURITY.md',
    project_url: 'https://example.test',
    source_code: 'https://github.com/example/sample',
});

const meta = {
    component: SecurityCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/SecurityCard/Responsive',
} satisfies Meta<typeof SecurityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: {
        programData: { authority: AUTHORITY, data: [validSecurityTxt, 'base64'], slot: 312_000_000 },
    } as any,
    pubkey: PUBKEY,
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
