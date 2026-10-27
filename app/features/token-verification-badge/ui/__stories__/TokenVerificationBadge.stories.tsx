import type { Meta, StoryObj } from '@storybook-config/types';

import { groupVerificationSources } from '../../model/use-verification-sources';
import { BaseTokenVerificationBadge } from '../BaseTokenVerificationBadge';
import {
    mockAllVerifiedSources,
    mockDangerousTokenSources,
    mockNotVerifiedSources,
    mockPartiallyVerifiedSources,
    mockRateLimitedSources,
} from './mock-verification-data';

const meta = {
    component: BaseTokenVerificationBadge,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenVerification/TokenVerificationBadge',
} satisfies Meta<typeof BaseTokenVerificationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    args: {
        isLoading: true,
        verificationResult: groupVerificationSources([]),
    },
};

export const FullyVerified: Story = {
    args: {
        verificationResult: groupVerificationSources(mockAllVerifiedSources()),
    },
};

export const PartiallyVerified: Story = {
    args: {
        verificationResult: groupVerificationSources(mockPartiallyVerifiedSources()),
    },
};

export const NotVerified: Story = {
    args: {
        verificationResult: groupVerificationSources(mockNotVerifiedSources()),
    },
};

export const RateLimited: Story = {
    args: {
        verificationResult: groupVerificationSources(mockRateLimitedSources()),
    },
};

export const DangerousToken: Story = {
    args: {
        verificationResult: groupVerificationSources(mockDangerousTokenSources()),
    },
};
