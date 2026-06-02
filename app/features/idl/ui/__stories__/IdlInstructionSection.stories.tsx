import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClipboardMock } from '@storybook-config/decorators';

import { IdlInstructionSection } from '../IdlInstructionSection';

const meta = {
    component: IdlInstructionSection,
    decorators: [withClipboardMock],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/IDL/UI/IdlInstructionSection',
} satisfies Meta<typeof IdlInstructionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        commands: ['npx @solana-program/program-metadata@latest write idl $PROGRAM_ID ./idl.json'],
        description: 'Use this command to upload generated idl in JSON format',
        title: 'Upload IDL',
    },
};

export const MultipleCommands: Story = {
    args: {
        commands: [
            'solana-keygen new --outfile authority.json',
            'npx @solana-program/program-metadata@latest write idl $PROGRAM_ID ./idl.json --authority ./authority.json',
        ],
        description: 'Initialize an authority and upload the IDL',
        title: 'Upload IDL with custom authority',
    },
};
