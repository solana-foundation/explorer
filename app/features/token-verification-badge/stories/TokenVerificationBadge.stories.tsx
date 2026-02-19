import type { Meta, StoryObj } from '@storybook/react';

import { BlupryntStatus } from '@/app/utils/bluprynt';
import { CoingeckoStatus } from '@/app/utils/coingecko';
import { JupiterStatus } from '@/app/utils/jupiter';
import { RugCheckStatus } from '@/app/utils/rugcheck';

import { TokenVerificationBadge } from '../ui/TokenVerificationBadge';

const meta = {
    component: TokenVerificationBadge,
    decorators: [
        Story => (
            <div className="e-p-4" style={{ backgroundColor: '#0E1311', minHeight: '300px' }}>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    title: 'Features/TokenVerification/TokenVerificationBadge',
} satisfies Meta<typeof TokenVerificationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock token info with coingeckoId
const mockTokenInfoVerified = {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    chainId: 101,
    decimals: 6,
    extensions: {
        coingeckoId: 'jupiter-exchange-solana',
    },
    logoURI: 'https://static.jup.ag/jup/icon.png',
    name: 'Jupiter',
    symbol: 'JUP',
    verified: true,
};

const mockTokenInfoUnverified = {
    address: 'UnknownToken111111111111111111111111111111',
    chainId: 101,
    decimals: 6,
    extensions: {},
    logoURI: undefined,
    name: 'Unknown Token',
    symbol: 'UNK',
};

const mockTokenInfoWithCoingecko = {
    ...mockTokenInfoUnverified,
    extensions: {
        coingeckoId: 'some-token',
    },
};

export const AllVerified: Story = {
    args: {
        blupryntInfo: { status: BlupryntStatus.Success, verified: true },
        coinInfo: { status: CoingeckoStatus.Success },
        jupiterInfo: { status: JupiterStatus.Success, verified: true },
        rugCheckInfo: { score: 10, status: RugCheckStatus.Success },
        tokenInfo: mockTokenInfoVerified,
    },
};

export const SolflareAndJupiterVerified: Story = {
    args: {
        coinInfo: { status: CoingeckoStatus.FetchFailed },
        jupiterInfo: { status: JupiterStatus.Success, verified: true },
        rugCheckInfo: { score: 99, status: RugCheckStatus.Success },
        tokenInfo: mockTokenInfoVerified,
    },
};

export const NotVerified: Story = {
    args: {
        coinInfo: undefined,
        jupiterInfo: undefined,
        rugCheckInfo: undefined,
        tokenInfo: undefined,
    },
};

export const RugcheckGood: Story = {
    args: {
        coinInfo: undefined,
        jupiterInfo: undefined,
        rugCheckInfo: { score: 15, status: RugCheckStatus.Success },
        tokenInfo: undefined,
    },
};

export const RugcheckWarning: Story = {
    args: {
        coinInfo: undefined,
        jupiterInfo: undefined,
        rugCheckInfo: { score: 45, status: RugCheckStatus.Success },
        tokenInfo: undefined,
    },
};

export const RugcheckDanger: Story = {
    args: {
        coinInfo: undefined,
        jupiterInfo: undefined,
        rugCheckInfo: { score: 85, status: RugCheckStatus.Success },
        tokenInfo: undefined,
    },
};

export const Loading: Story = {
    args: {
        coinInfo: { status: CoingeckoStatus.Loading },
        isTokenInfoLoading: true,
        jupiterInfo: { status: JupiterStatus.Loading, verified: false },
        rugCheckInfo: { score: 0, status: RugCheckStatus.Loading },
        tokenInfo: undefined,
    },
};

export const CoingeckoVerified: Story = {
    args: {
        coinInfo: { status: CoingeckoStatus.Success },
        jupiterInfo: undefined,
        rugCheckInfo: undefined,
        tokenInfo: mockTokenInfoWithCoingecko,
    },
};
