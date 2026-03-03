import type { Meta, StoryObj } from '@storybook/react';

import { BaseTokenVerificationBadge } from '../BaseTokenVerificationBadge';
import {
    createMockVerificationResult,
    mockAllVerifiedSources,
    mockDangerousTokenSources,
    mockNotVerifiedSources,
    mockPartiallyVerifiedSources,
    mockRateLimitedSources,
} from './mock-verification-data';

const meta = {
    component: BaseTokenVerificationBadge,
    title: 'Features/TokenVerification/TokenVerificationBadge',
} satisfies Meta<typeof BaseTokenVerificationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    args: {
        isLoading: true,
        verificationResult: {
            rateLimitedSources: [],
            sources: [],
            sourcesToApply: [],
            verificationFoundSources: [],
        },
    },
};

export const FullyVerified: Story = {
    args: {
        verificationResult: createMockVerificationResult(mockAllVerifiedSources()),
    },
};

export const PartiallyVerified: Story = {
    args: {
        verificationResult: createMockVerificationResult(mockPartiallyVerifiedSources()),
    },
};

export const NotVerified: Story = {
    args: {
        verificationResult: createMockVerificationResult(mockNotVerifiedSources()),
    },
};

export const RateLimited: Story = {
    args: {
        verificationResult: createMockVerificationResult(mockRateLimitedSources()),
    },
};

export const DangerousToken: Story = {
    args: {
        verificationResult: createMockVerificationResult(mockDangerousTokenSources()),
    },
};
