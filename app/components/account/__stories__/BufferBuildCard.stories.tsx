import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import type { OsecBuild } from '@/app/utils/verified-builds';

import { BaseBufferBuildCard } from '../BufferBuildCard';

// BaseBufferBuildCard is the presentational split: `BufferBuildCard` is the container that hashes
// the buffer and calls `/resolve-hash`; Base takes the resolved builds as props so stories drive
// every state without the network.

const BUFFER_HASH = '70386b8957a11985ca67032d98bfa39c6d11c1c5e87b6a32b386611ea3b39b96';

// Two real builds returned by `/resolve-hash` for BUFFER_HASH: same program/repo, distinct commits.
const TRUSTED_BUILD: OsecBuild = {
    build_id: 'ce8a84f7-aafa-43cd-a0e0-4599fe366675',
    commit: '39de954ea527007cc9da9f50c47be2c1d28594bc',
    completed_at: '2026-07-21T11:51:56.865386',
    matches_deployed: true,
    program_id: 'wocur7QRRMdzPZN52688gBa5iJD4mLkNWSxN5xGGRjY',
    repository: 'https://github.com/Woody4618/workflow-tutorial',
    signer: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
    trusted: true,
};

const TRUSTED_BUILD_OLDER: OsecBuild = {
    ...TRUSTED_BUILD,
    build_id: '9bf4d264-3085-49a2-8098-c9bced6f640b',
    commit: '0b6c86b069b3787b58db24412a890cb6d0d33303',
    completed_at: '2026-07-20T20:46:48.892517',
};

// Synthetic entry so the untrusted (`secondary`) and not-deployed (`warning`) badges are covered.
const UNTRUSTED_BUILD: OsecBuild = {
    ...TRUSTED_BUILD,
    build_id: 'untrusted-not-deployed',
    matches_deployed: false,
    signer: 'GWk2DoJez1mwMWStprqusThgbzW8RmvgznnnXXqWHJoo',
    trusted: false,
};

const meta = {
    component: BaseBufferBuildCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/BufferBuildCard',
} satisfies Meta<typeof BaseBufferBuildCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleBuilds: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: [TRUSTED_BUILD, TRUSTED_BUILD_OLDER, UNTRUSTED_BUILD],
        error: false,
        isLoading: false,
    },
};

export const SingleBuild: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: [TRUSTED_BUILD],
        error: false,
        isLoading: false,
    },
};

export const NoBuilds: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: [],
        error: false,
        isLoading: false,
    },
};

export const Loading: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: undefined,
        error: false,
        isLoading: true,
    },
};

export const Error: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: undefined,
        error: true,
        isLoading: false,
    },
};

// Testnet/Custom have no OSEC registry, so no resolve-hash lookup runs and the card says so
// rather than claiming the lookup found no builds.
export const ClusterUnsupported: Story = {
    args: {
        bufferHash: BUFFER_HASH,
        builds: undefined,
        clusterSupported: false,
        error: false,
        isLoading: false,
    },
};
