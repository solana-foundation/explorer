import type { ClusterState } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { hashProgramData } from '@utils/verified-builds';
import { SWRConfig } from 'swr';

import { VerifiedProgramBadge } from '../VerifiedProgramBadge';

const pubkey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const programData = {
    authority: new PublicKey('11111111111111111111111111111111'),
    data: ['', 'base64'],
    slot: 1,
} as any;

// Hash must match what the hook computes from `programData`, otherwise even
// `is_verified: true` is rejected by the on-chain-hash cross-check.
const expectedHash = hashProgramData(programData);

type OsecOutcome = 'verified' | 'unverified' | 'loading' | 'error';

const withMockedOsec = (outcome: OsecOutcome, state?: ClusterState): Decorator =>
    function WithMockedOsec(Story) {
        const originalFetch = window.fetch;
        window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            if (!url.includes('osec.io')) return originalFetch(input as any, init);
            if (outcome === 'loading') return new Promise<Response>(() => {});
            if (outcome === 'error') throw new Error('mocked OSEC failure');
            return new Response(JSON.stringify({ is_verified: outcome === 'verified', on_chain_hash: expectedHash }), {
                headers: { 'content-type': 'application/json' },
                status: 200,
            });
        }) as typeof window.fetch;
        return (
            <SWRConfig value={{ provider: () => new Map() }}>
                <MockClusterProvider state={state}>
                    <Story />
                </MockClusterProvider>
            </SWRConfig>
        );
    };

const devnetState: ClusterState = {
    cluster: Cluster.Devnet,
    customUrl: 'https://api.devnet.solana.com',
    status: ClusterStatus.Connected,
};

const testnetState: ClusterState = {
    cluster: Cluster.Testnet,
    customUrl: 'https://api.testnet.solana.com',
    status: ClusterStatus.Connected,
};

const withUnsupportedCluster: Decorator = Story => (
    <MockClusterProvider state={testnetState}>
        <Story />
    </MockClusterProvider>
);

const meta: Meta<typeof VerifiedProgramBadge> = {
    args: { programData, pubkey },
    component: VerifiedProgramBadge,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/VerifiedProgramBadge',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Cluster guard short-circuits before any RPC on clusters without an OSEC registry
// (here: Testnet); exercises `badge bg-warning-soft rank`.
export const UnsupportedCluster: Story = {
    decorators: [withUnsupportedCluster],
};

export const Verified: Story = {
    decorators: [withMockedOsec('verified')],
};

// Devnet is a supported cluster: the badge resolves against verify-devnet.osec.io.
export const DevnetVerified: Story = {
    decorators: [withMockedOsec('verified', devnetState)],
};

export const NotVerified: Story = {
    decorators: [withMockedOsec('unverified')],
};

export const Loading: Story = {
    decorators: [withMockedOsec('loading')],
};

export const FetchError: Story = {
    decorators: [withMockedOsec('error')],
};
