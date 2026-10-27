import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import { ERiskLevel } from '../../model/use-rugcheck';
import { TokenVerificationButton } from '../TokenVerificationButton';
import { mockJupiterSource, mockRugCheckSource } from './mock-verification-data';

const jupiterVerified = mockJupiterSource();
const rugcheckGood = mockRugCheckSource({ level: ERiskLevel.Good, score: 90 });
const rugcheckWarning = mockRugCheckSource({ level: ERiskLevel.Warning, score: 55 });

const meta: Meta<typeof TokenVerificationButton> = {
    args: { isOpen: false, onClick: fn() },
    component: TokenVerificationButton,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenVerificationBadge/TokenVerificationButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NotVerified: Story = {
    args: { verificationFoundSources: [] },
};

export const VerifiedSingleSource: Story = {
    args: { verificationFoundSources: [jupiterVerified] },
};

export const VerifiedMultipleSources: Story = {
    args: { verificationFoundSources: [jupiterVerified, rugcheckGood] },
};

export const RugCheckWarning: Story = {
    args: { verificationFoundSources: [rugcheckWarning] },
};

export const Loading: Story = {
    args: { isLoading: true, verificationFoundSources: [] },
};

export const Open: Story = {
    args: { isOpen: true, verificationFoundSources: [jupiterVerified] },
};
