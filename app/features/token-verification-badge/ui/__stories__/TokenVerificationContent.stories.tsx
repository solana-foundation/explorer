import type { Meta, StoryObj } from '@storybook-config/types';

import { ERiskLevel } from '../../model/use-rugcheck';
import { TokenVerificationContent } from '../TokenVerificationContent';
import { mockCoinGeckoSource, mockJupiterSource, mockRugCheckSource } from './mock-verification-data';

const jupiterVerified = mockJupiterSource();
const rugcheckGood = mockRugCheckSource({ level: ERiskLevel.Good, score: 88 });
const rugcheckRateLimited = mockRugCheckSource({
    isRateLimited: true,
    isVerificationFound: false,
    level: undefined,
    score: undefined,
    verified: false,
});
const coingeckoApply = mockCoinGeckoSource({ isVerificationFound: false, verified: false });

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
        sourcesToApply: [coingeckoApply],
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
        sourcesToApply: [coingeckoApply],
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
