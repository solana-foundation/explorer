import type { Meta, StoryObj } from '@storybook-config/types';

import { EVerificationSource, type VerificationSource } from '../../lib/types';
import { ERiskLevel } from '../../model/use-rugcheck';
import { TokenVerificationContent } from '../TokenVerificationContent';

const jupiterVerified: VerificationSource = {
    name: EVerificationSource.Jupiter,
    url: 'https://jup.ag',
    verified: true,
};

const rugcheckGood: VerificationSource = {
    level: ERiskLevel.Good,
    name: EVerificationSource.RugCheck,
    score: 88,
    url: 'https://rugcheck.xyz',
    verified: true,
};

const rugcheckRateLimited: VerificationSource = {
    isRateLimited: true,
    name: EVerificationSource.RugCheck,
    url: 'https://rugcheck.xyz',
    verified: false,
};

const blupryntApply: VerificationSource = {
    applyUrl: 'https://bluprynt.com/apply',
    name: EVerificationSource.Bluprynt,
    verified: false,
};

const meta: Meta<typeof TokenVerificationContent> = {
    component: TokenVerificationContent,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenVerificationBadge/TokenVerificationContent',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoVerificationsWithApplyOptions: Story = {
    args: {
        rateLimitedSources: [],
        sourcesToApply: [blupryntApply],
        verificationFoundSources: [],
    },
};

export const SingleVerification: Story = {
    args: {
        rateLimitedSources: [],
        sourcesToApply: [],
        verificationFoundSources: [jupiterVerified],
    },
};

export const MultipleVerifications: Story = {
    args: {
        rateLimitedSources: [],
        sourcesToApply: [],
        verificationFoundSources: [jupiterVerified, rugcheckGood],
    },
};

export const WithRateLimitedSources: Story = {
    args: {
        rateLimitedSources: [rugcheckRateLimited],
        sourcesToApply: [],
        verificationFoundSources: [jupiterVerified],
    },
};

export const FullState: Story = {
    args: {
        rateLimitedSources: [rugcheckRateLimited],
        sourcesToApply: [blupryntApply],
        verificationFoundSources: [jupiterVerified, rugcheckGood],
    },
};

export const Loading: Story = {
    args: {
        isLoading: true,
        rateLimitedSources: [],
        sourcesToApply: [],
        verificationFoundSources: [],
    },
};
