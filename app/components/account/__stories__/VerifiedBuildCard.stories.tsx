import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';

import type { OsecRegistryInfo } from '@/app/utils/verified-builds';
import { VerificationStatus } from '@/app/utils/verified-builds';

import { BaseVerifiedBuildCard } from '../VerifiedBuildCard';

// BaseVerifiedBuildCard is the presentational split: `VerifiedBuildCard` is the container that
// calls useVerifiedProgram (verify.osec.io + RPC PDA fetch); Base takes the resolved data as
// props so stories can drive every variant without mocking the network or the SWR cache.

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
    onchain_repo_url: 'https://github.com/example/verified-program',
    repo_url: 'https://github.com/example/verified-program',
    signer: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
    verification_status: VerificationStatus.Verified,
    verify_command:
        'solana-verify verify-from-repo -um --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA https://github.com/example/verified-program --commit-hash abc1234',
};

const NOT_VERIFIED_FIXTURE: OsecRegistryInfo = {
    ...VERIFIED_FIXTURE,
    is_verified: false,
    message: 'No verified build found',
    verification_status: VerificationStatus.NotVerified,
    verify_command: 'Program does not have a verify PDA uploaded.',
};

const PDA_UPLOADED_FIXTURE: OsecRegistryInfo = {
    ...VERIFIED_FIXTURE,
    is_verified: false,
    message: 'Verification information provided by the program authority.',
    verification_status: VerificationStatus.PdaUploaded,
};

const meta = {
    component: BaseVerifiedBuildCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/VerifiedBuildCard',
} satisfies Meta<typeof BaseVerifiedBuildCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoProgramData: Story = {
    args: {
        data: { programData: undefined } as any,
        isLoading: false,
        registryInfo: null,
    },
};

export const Loading: Story = {
    args: {
        data: PROGRAM_DATA,
        isLoading: true,
        registryInfo: null,
    },
};

export const NotUploaded: Story = {
    args: {
        data: PROGRAM_DATA,
        isLoading: false,
        registryInfo: null,
    },
};

export const Verified: Story = {
    args: {
        data: PROGRAM_DATA,
        isLoading: false,
        registryInfo: VERIFIED_FIXTURE,
    },
};

export const NotVerified: Story = {
    args: {
        data: PROGRAM_DATA,
        isLoading: false,
        registryInfo: NOT_VERIFIED_FIXTURE,
    },
};

export const PdaUploaded: Story = {
    args: {
        data: PROGRAM_DATA,
        isLoading: false,
        registryInfo: PDA_UPLOADED_FIXTURE,
    },
};
