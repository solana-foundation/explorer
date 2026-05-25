import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { createNextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';

import {
    UpgradeableLoaderAccountSection,
    UpgradeableProgramBufferSection,
    UpgradeableProgramDataSection,
    UpgradeableProgramSection,
} from '../UpgradeableLoaderAccountSection';

const PROGRAM_PUBKEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const PROGRAM_DATA_PUBKEY = new PublicKey('So11111111111111111111111111111111111111112');
const AUTHORITY_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
const BPF_UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

const sampleAccount: Account = {
    data: {},
    executable: true,
    lamports: 5_542_247_638,
    owner: BPF_UPGRADEABLE_LOADER,
    pubkey: PROGRAM_PUBKEY,
    space: 36,
};

const sampleProgramData = {
    authority: AUTHORITY_PUBKEY,
    data: ['', 'base64' as const] as [string, 'base64'],
    slot: 312_456_789,
};

// Devnet cluster keeps useSquadsMultisigLookup from firing — the hook returns null
// immediately when cluster !== Mainnet, avoiding a Suspense throw in Storybook.
const meta = {
    component: UpgradeableLoaderAccountSection,
    decorators: [withClusterAndAccounts],
    parameters: createNextjsParameters({ query: { cluster: 'devnet' } }),
    tags: ['autodocs'],
    title: 'Components/Account/UpgradeableLoaderAccountSection',
} satisfies Meta<typeof UpgradeableLoaderAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgramWithAuthority: Story = {
    args: {
        account: sampleAccount,
        parsedData: { info: { programData: PROGRAM_DATA_PUBKEY }, type: 'program' },
        programData: sampleProgramData,
    },
};

export const ProgramClosed: Story = {
    args: {
        account: { ...sampleAccount, executable: false },
        parsedData: { info: { programData: PROGRAM_DATA_PUBKEY }, type: 'program' },
        programData: undefined,
    },
};

export const ProgramFrozen: Story = {
    args: {
        account: sampleAccount,
        parsedData: { info: { programData: PROGRAM_DATA_PUBKEY }, type: 'program' },
        programData: { ...sampleProgramData, authority: null },
    },
};

// Inner sections rendered standalone so each card variant is visually catalogued.

export const ProgramDataDirect: StoryObj<typeof UpgradeableProgramDataSection> = {
    args: {
        account: { ...sampleAccount, pubkey: PROGRAM_DATA_PUBKEY },
        programData: sampleProgramData,
    },
    render: args => <UpgradeableProgramDataSection {...args} />,
};

export const ProgramBufferDirect: StoryObj<typeof UpgradeableProgramBufferSection> = {
    args: {
        account: { ...sampleAccount, pubkey: PROGRAM_DATA_PUBKEY },
        programBuffer: { authority: AUTHORITY_PUBKEY },
    },
    render: args => <UpgradeableProgramBufferSection {...args} />,
};

export const ProgramSectionDirect: StoryObj<typeof UpgradeableProgramSection> = {
    args: {
        account: sampleAccount,
        programAccount: { programData: PROGRAM_DATA_PUBKEY },
        programData: sampleProgramData,
    },
    render: args => <UpgradeableProgramSection {...args} />,
};
