import type { Meta, StoryObj } from '@storybook/react';

import { PmpSecurityTxtTable } from '../PmpSecurityTxtTable';
import defaultSecurityTxtMock from './mocks/defaultSecurityTxt.json';

const meta = {
    component: PmpSecurityTxtTable,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        backgrounds: {
            default: 'Card',
        },
        docs: {
            description: {
                story: 'Render security.txt from Program Metadata',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/security/PmpSecurityTxtTable',
} satisfies Meta<typeof PmpSecurityTxtTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        data: defaultSecurityTxtMock as any,
    },
};

export const Nested: Story = {
    args: {
        data: {
            name: 'Example with arbitrary nested fields',
            nested_record: {
                num: 42,
                record: {
                    empty: '',
                    spaces: '   ',
                    struct: { mint: 'pubkey', name: 'String' },
                    vec: ['Option 1', 'Option 2'],
                },
                string_num: '13e6',
                test_nullalble: null,
            },
        },
    },
};

export const Arbitrary: Story = {
    args: {
        data: {
            arbitrary_contacts: ['mail:test:::@mail.mail', 'twitter:@twit123', 'some:text:data', 'contact', null],
            array_with_arbitrary_data: [
                'htt:/invalid.',
                12e19,
                'https://github.com',
                'Discord: Handle123#',
                1,
                2,
                3,
                4,
                5,
            ],
            empty: '',
            invalid_link: 'google.',
            name: 'Example with invalid fields',
            script: '<script>alert(12)</script>',
            spaces: '     ',
        },
    },
};
