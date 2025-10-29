import type { Meta, StoryObj } from '@storybook/react';

import { FormattedIdlView } from '../formatted-idl/IdlView';

const meta = {
    component: FormattedIdlView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/FormattedIdlView',
} satisfies Meta<typeof FormattedIdlView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InstructionsOnly: Story = {
    args: {
        idl: {
            instructions: [
                {
                    accounts: [
                        { docs: ['Account authority'], name: 'authority', signer: true, writable: false },
                        { docs: ['New account'], name: 'newAccount', signer: false, writable: true },
                    ],
                    args: [{ docs: ['Initial data value'], name: 'data', type: 'u64' }],
                    docs: ['Initialize a new account'],
                    name: 'initialize',
                },
                {
                    accounts: [
                        { docs: ['Account authority'], name: 'authority', signer: true, writable: false },
                        { docs: ['Account to update'], name: 'account', signer: false, writable: true },
                    ],
                    args: [{ docs: ['New data value'], name: 'newData', type: 'u64' }],
                    docs: ['Update an account'],
                    name: 'update',
                },
            ],
        },
    },
};

export const WithAccountsAndTypes: Story = {
    args: {
        idl: {
            accounts: [
                {
                    docs: ['Main system configuration account'],
                    fieldType: {
                        fields: [
                            { name: 'admin', type: 'publicKey' },
                            { name: 'settings', type: 'Settings' },
                            { name: 'initialized', type: 'bool' },
                        ],
                        kind: 'struct',
                    },
                    name: 'SystemAccount',
                },
            ],
            instructions: [
                {
                    accounts: [
                        { docs: ['Admin account'], name: 'admin', signer: true, writable: false },
                        { docs: ['System account'], name: 'systemAccount', signer: false, writable: true },
                    ],
                    args: [],
                    docs: ['Initialize the program'],
                    name: 'initialize',
                },
            ],
            types: [
                {
                    docs: ['System settings'],
                    fieldType: {
                        fields: [
                            { name: 'maxUsers', type: 'u32' },
                            { name: 'feeBps', type: 'u16' },
                            { name: 'allowListEnabled', type: 'bool' },
                        ],
                        kind: 'struct',
                    },
                    name: 'Settings',
                },
            ],
        },
    },
};

export const WithAllSections: Story = {
    args: {
        idl: {
            accounts: [
                {
                    docs: ['Marketplace state account'],
                    fieldType: {
                        fields: [
                            { name: 'authority', type: 'publicKey' },
                            { name: 'name', type: 'string' },
                            { name: 'feeBps', type: 'u16' },
                            { name: 'status', type: 'MarketStatus' },
                        ],
                        kind: 'struct',
                    },
                    name: 'Marketplace',
                },
            ],
            constants: [
                {
                    docs: ['Maximum length for marketplace name'],
                    name: 'MAX_NAME_LENGTH',
                    type: 'u32',
                    value: '50',
                },
                {
                    docs: ['Maximum fee in basis points (100%)'],
                    name: 'MAX_FEE_BPS',
                    type: 'u16',
                    value: '10000',
                },
            ],
            errors: [
                {
                    code: '6000',
                    message: 'You are not authorized to perform this action',
                    name: 'Unauthorized',
                },
                {
                    code: '6001',
                    message: 'Fee basis points must be between 0 and 10000',
                    name: 'InvalidFeeBps',
                },
            ],
            events: [
                {
                    docs: ['Emitted when a new marketplace is created'],
                    fieldType: {
                        fields: [
                            { name: 'marketplaceId', type: 'publicKey' },
                            { name: 'creator', type: 'publicKey' },
                            { name: 'name', type: 'string' },
                            { name: 'timestamp', type: 'i64' },
                        ],
                        kind: 'struct',
                    },
                    name: 'MarketplaceCreated',
                },
            ],
            instructions: [
                {
                    accounts: [
                        { docs: ['Marketplace creator'], name: 'creator', signer: true, writable: true },
                        {
                            docs: ['New marketplace account'],
                            name: 'marketplaceAccount',
                            pda: true,
                            signer: false,
                            writable: true,
                        },
                    ],
                    args: [
                        { docs: ['Marketplace name'], name: 'name', type: 'string' },
                        { docs: ['Fee in basis points'], name: 'feeBps', type: 'u16' },
                    ],
                    docs: ['Create a new marketplace'],
                    name: 'createMarketplace',
                },
            ],
            pdas: [
                {
                    docs: ['PDA for marketplace account'],
                    name: 'MarketplaceAccount',
                    seeds: [
                        { kind: 'type', name: 'creator', type: 'publicKey' },
                        { kind: 'type', name: 'name', type: 'string' },
                    ],
                },
            ],
            types: [
                {
                    docs: ['Status of the marketplace'],
                    fieldType: {
                        kind: 'enum',
                        variants: ['Active', 'Paused', 'Shutdown'],
                    },
                    name: 'MarketStatus',
                },
            ],
        },
    },
};

export const WithSomeSectionsEmpty: Story = {
    args: {
        idl: {
            accounts: [],
            constants: [
                {
                    docs: ['Program version'],
                    name: 'VERSION',
                    type: 'string',
                    value: '"1.0.0"',
                },
            ],
            errors: [],
            events: [],
            instructions: [
                {
                    accounts: [{ docs: ['User account'], name: 'user', signer: true, writable: false }],
                    args: [],
                    docs: ['A simple instruction'],
                    name: 'simpleInstruction',
                },
            ],
            pdas: [],
            types: [
                {
                    docs: ['A simple type'],
                    fieldType: {
                        kind: 'type',
                        name: 'SimpleType',
                        type: 'string',
                    },
                    name: 'SimpleType',
                },
            ],
        },
    },
};

export const EmptyIdl: Story = {
    args: {
        idl: null,
    },
};
