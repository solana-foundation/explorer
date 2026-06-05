import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import type { OsecRegistryInfo } from '@/app/utils/verified-builds';
import { VerificationStatus } from '@/app/utils/verified-builds';

import { BaseVerifiedBuildCard } from '../VerifiedBuildCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const PROGRAM_DATA = {
    programData: {
        authority: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
        data: ['', 'base64'],
        slot: 0,
    },
} as any;

const VERIFIED_FIXTURE: OsecRegistryInfo = {
    executable_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    is_verified: true,
    last_verified_at: '2026-01-01T00:00:00.000Z',
    message: 'Verification information provided by a trusted signer.',
    on_chain_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    repo_url: 'https://github.com/example/verified-program',
    signer: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
    verification_status: VerificationStatus.Verified,
    verify_command:
        'solana-verify verify-from-repo -um --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA https://github.com/example/verified-program --commit-hash abc1234',
};

const meta = {
    component: BaseVerifiedBuildCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/VerifiedBuildCard/Responsive',
} satisfies Meta<typeof BaseVerifiedBuildCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: PROGRAM_DATA,
    isLoading: false,
    registryInfo: VERIFIED_FIXTURE,
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
