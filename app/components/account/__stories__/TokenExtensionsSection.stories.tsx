import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import type { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionsSection } from '../TokenExtensionsSection';
import type { ParsedTokenExtension } from '../types';

const MINT_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const tokenMetadataState = {
    additionalMetadata: [],
    mint: MINT_ADDRESS,
    name: 'Sample Token',
    symbol: 'SAMP',
    updateAuthority: MINT_ADDRESS,
    uri: 'https://example.test/sample.json',
};

const sampleParsedExtensions: ParsedTokenExtension[] = [
    {
        description: 'Metadata stored directly in the mint',
        extension: 'tokenMetadata',
        externalLinks: [],
        name: 'Token Metadata',
        parsed: tokenMetadataState,
        status: 'active',
    },
    {
        description: 'Mint can be permanently delegated to a different address',
        extension: 'permanentDelegate',
        externalLinks: [],
        name: 'Permanent Delegate',
        parsed: { delegate: MINT_ADDRESS },
        status: 'active',
    },
];

const sampleExtensions: TokenExtension[] = [
    { extension: 'tokenMetadata', state: sampleParsedExtensions[0].parsed },
    { extension: 'permanentDelegate', state: sampleParsedExtensions[1].parsed },
];

const meta = {
    component: TokenExtensionsSection,
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/TokenExtensionsSection',
} satisfies Meta<typeof TokenExtensionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        address: MINT_ADDRESS,
        decimals: 6,
        extensions: sampleExtensions,
        parsedExtensions: sampleParsedExtensions,
        symbol: 'SAMP',
    },
};
