import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { toBase64 } from '@/app/shared/lib/bytes';

import { SecurityCard } from '../SecurityCard';

const PUBKEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const AUTHORITY = new PublicKey('11111111111111111111111111111111');

const NEODYME_HEADER = '=======BEGIN SECURITY.TXT V1=======\0';
const NEODYME_FOOTER = '=======END SECURITY.TXT V1=======\0';

// Build a legacy Neodyme (ELF) security.txt section. NOTE: SecurityCard now resolves security.txt via
// `useSecurityTxt` (the `/api/security-txt` route), not by parsing these bytes — to render content in
// Storybook these stories need a `useSecurityTxt` mock/decorator. `NoProgramData` still works as-is.
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
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/SecurityCard',
} satisfies Meta<typeof SecurityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Embedded Neodyme security.txt → SecurityCard delegates to ProgramSecurityTxtCard.
export const WithEmbeddedSecurityTxt: Story = {
    args: {
        data: {
            programData: { authority: AUTHORITY, data: [validSecurityTxt, 'base64'], slot: 312_000_000 },
        } as any,
        pubkey: PUBKEY,
    },
};

// ProgramData exists but contains no security.txt header → EmptySecurityTxtCard.
export const NoSecurityTxt: Story = {
    args: {
        data: {
            programData: {
                authority: AUTHORITY,
                data: [toBase64(new Uint8Array([0, 1, 2, 3])), 'base64'],
                slot: 312_000_000,
            },
        } as any,
        pubkey: PUBKEY,
    },
};

// Closed program (no programData at all) → ErrorCard "Account has no data".
export const NoProgramData: Story = {
    args: {
        data: { programData: undefined } as any,
        pubkey: PUBKEY,
    },
};
