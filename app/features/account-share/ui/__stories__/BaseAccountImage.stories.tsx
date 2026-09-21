import { gen } from '@__fixtures__/gen';
import { truncateAddress } from '@entities/address';
import { IMAGE_SIZE } from '@shared/lib/og/image-size';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import type { OgGlows } from '../../lib/og-glows';
import type { AccountCardData, ProgramCardData } from '../../model/account-share-data';
import { BaseAccountImage } from '../BaseAccountImage';

const ADDRESS = gen.address(1);
const OWNER = gen.address(2);
const AUTHORITY = gen.address(3);

// A browser resolves these paths on its own. The route hands the same two images in as data URIs, because
// satori resolves no relative URL - see `loadOgGlows`.
const GLOWS: OgGlows = { notFound: '/img/og/amber_gradient.png', success: '/img/og/green_gradient.png' };

const accountData: AccountCardData = {
    address: ADDRESS,
    balance: '2.03928144 SOL',
    dataSize: '165 B',
    executable: false,
    kind: 'account',
    lastActivity: 'Aug 26, 2026',
    owner: OWNER,
    transactionCount: '1,204',
};

const programData: ProgramCardData = {
    address: ADDRESS,
    kind: 'program',
    lastDeployedSlot: 208871522,
    markers: { idlUploaded: true, securityTxt: true, verifiedBuild: true },
    name: 'Jupiter Aggregator v6',
    programSize: '1.24 MB',
    upgradeAuthority: { address: AUTHORITY, note: 'Squads multisig 3 of 5' },
};

const meta: Meta<typeof BaseAccountImage> = {
    argTypes: {
        data: {
            control: 'object',
            description: 'Shaped account data. undefined renders the fallback.',
        },
    },
    args: { glows: GLOWS },
    component: BaseAccountImage,
    decorators: [
        Story => (
            <div style={{ height: IMAGE_SIZE.height, width: IMAGE_SIZE.width }}>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/AccountShare/BaseAccountImage',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Account: Story = {
    args: { data: accountData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Explorer')).toBeInTheDocument();
        expect(canvas.getByTestId('account-image-type')).toHaveTextContent('Account');
        expect(canvas.getByTestId('account-image-owner')).toHaveTextContent(truncateAddress(OWNER, 6));
        expect(canvas.getByTestId('account-image-balance')).toHaveTextContent('2.03928144 SOL');
        expect(canvas.getByTestId('account-image-address')).toHaveTextContent(truncateAddress(ADDRESS, 6));
        expect(canvas.getByTestId('account-image-tx-count')).toHaveTextContent('1,204');
        expect(canvas.getByText('transactions')).toBeInTheDocument();
        expect(canvas.getByText('last Aug 26, 2026')).toBeInTheDocument();

        expect(canvas.getByText('Data size')).toBeInTheDocument();
        expect(canvas.getByText('165 B')).toBeInTheDocument();
        expect(canvas.getByText('Executable')).toBeInTheDocument();
        expect(canvas.getByText('No')).toBeInTheDocument();
        expect(canvas.getByTestId('account-image-glow').style.backgroundImage).toContain('green_gradient');
    },
};

export const Program: Story = {
    args: { data: programData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByTestId('account-image-type')).toHaveTextContent('Program');
        expect(canvas.getByTestId('account-image-program-name')).toHaveTextContent('Jupiter Aggregator v6');
        expect(canvas.getByTestId('account-image-address')).toHaveTextContent(truncateAddress(ADDRESS, 6));

        const markers = canvas.getAllByTestId('account-image-marker');
        expect(markers).toHaveLength(3);
        expect(canvas.getByText('Verified build')).toBeInTheDocument();
        expect(canvas.getByText('IDL uploaded')).toBeInTheDocument();
        expect(canvas.getByText('security.txt')).toBeInTheDocument();

        expect(canvas.getByText('Upgrade authority')).toBeInTheDocument();
        expect(canvas.getByText('Squads multisig 3 of 5')).toBeInTheDocument();
        expect(canvas.getByText('Last deployed')).toBeInTheDocument();
        expect(canvas.getByText('Slot 208,871,522')).toBeInTheDocument();
        expect(canvas.getByText('Program size')).toBeInTheDocument();
        expect(canvas.getByText('1.24 MB')).toBeInTheDocument();
    },
};

export const ProgramUnverified: Story = {
    args: {
        data: {
            ...programData,
            markers: { idlUploaded: false, securityTxt: false, verifiedBuild: false },
            upgradeAuthority: { address: AUTHORITY, alert: true, note: 'Single key' },
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Not verified')).toBeInTheDocument();
        expect(canvas.getByText('No IDL')).toBeInTheDocument();
        expect(canvas.getByText('No security.txt')).toBeInTheDocument();
        expect(canvas.getByText('Single key')).toBeInTheDocument();
    },
};

export const NotFoundNeverUsed: Story = {
    args: { data: { address: ADDRESS, kind: 'not-found', reason: 'never-used' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByTestId('account-image-pill')).toHaveTextContent('Never used');
        expect(canvas.getByText('Nothing at this address')).toBeInTheDocument();
        expect(canvas.getByTestId('account-image-reason')).toBeInTheDocument();
        expect(canvas.getByTestId('account-image-glow').style.backgroundImage).toContain('amber_gradient');
    },
};

export const NotFoundClosed: Story = {
    args: { data: { address: ADDRESS, kind: 'not-found', reason: 'closed' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByTestId('account-image-pill')).toHaveTextContent('Closed');
        expect(canvas.getByText('Account closed')).toBeInTheDocument();
    },
};

export const NotFoundOtherCluster: Story = {
    args: { data: { address: ADDRESS, kind: 'not-found', reason: 'other-cluster' } },
};

export const Fallback: Story = {
    args: { data: undefined },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByTestId('account-image-fallback')).toBeInTheDocument();
    },
};
