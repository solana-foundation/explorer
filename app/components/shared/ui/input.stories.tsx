import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Input } from './input';

type InputVariant = NonNullable<React.ComponentProps<typeof Input>['variant']>;
type InputType = React.ComponentProps<'input'>['type'];

const variantOptions = ['default', 'dark'] as const satisfies readonly InputVariant[];
const typeOptions = [
    'text',
    'email',
    'password',
    'number',
    'tel',
    'url',
    'search',
] as const satisfies readonly NonNullable<InputType>[];

const meta: Meta<typeof Input> = {
    argTypes: {
        disabled: {
            control: 'boolean',
        },
        placeholder: {
            control: 'text',
        },
        type: {
            control: 'select',
            options: typeOptions,
        },
        variant: {
            control: 'select',
            options: variantOptions,
        },
    },
    component: Input,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Input',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByPlaceholderText('Enter text...');
        expect(input).toBeInTheDocument();
    },
};

export const AllVariants: Story = {
    render: () => {
        const variantLabels: Record<InputVariant, string> = {
            dark: 'Dark Variant',
            default: 'Default Variant',
        };

        return (
            <div className="flex w-full max-w-md flex-col gap-4">
                {variantOptions.map(variant => (
                    <div key={variant} className="flex flex-col gap-2">
                        <label htmlFor={`${variant}-variant`} className="text-sm font-semibold text-white">
                            {variantLabels[variant]}
                        </label>
                        <Input
                            id={`${variant}-variant`}
                            variant={variant}
                            placeholder={`${variantLabels[variant]} input`}
                        />
                    </div>
                ))}
            </div>
        );
    },
};

export const WithValue: Story = {
    render: () => (
        <div className="flex w-full max-w-md flex-col gap-4">
            {variantOptions.map(variant => (
                <div key={variant} className="flex flex-col gap-2">
                    <label htmlFor={`${variant}-with-value`} className="text-sm font-semibold text-white">
                        {variant.charAt(0).toUpperCase() + variant.slice(1)} with value
                    </label>
                    <Input id={`${variant}-with-value`} variant={variant} defaultValue="Sample text value" />
                </div>
            ))}
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <div className="flex w-full max-w-md flex-col gap-4">
            {variantOptions.flatMap(variant => [
                <div key={`${variant}-placeholder`} className="flex flex-col gap-2">
                    <label htmlFor={`disabled-${variant}`} className="text-sm font-semibold text-white">
                        Disabled {variant.charAt(0).toUpperCase() + variant.slice(1)}
                    </label>
                    <Input id={`disabled-${variant}`} variant={variant} placeholder="Disabled input" disabled />
                </div>,
                <div key={`${variant}-value`} className="flex flex-col gap-2">
                    <label
                        htmlFor={`disabled-${variant}-with-value`}
                        className="text-sm font-semibold text-white"
                    >
                        Disabled {variant.charAt(0).toUpperCase() + variant.slice(1)} with value
                    </label>
                    <Input
                        id={`disabled-${variant}-with-value`}
                        variant={variant}
                        defaultValue="Cannot edit this"
                        disabled
                    />
                </div>,
            ])}
        </div>
    ),
};

export const ErrorState: Story = {
    render: () => (
        <div className="flex w-full max-w-md flex-col gap-4">
            {variantOptions.map(variant => (
                <div key={variant} className="flex flex-col gap-2">
                    <label htmlFor={`error-${variant}`} className="text-sm font-semibold text-white">
                        Error State ({variant.charAt(0).toUpperCase() + variant.slice(1)})
                    </label>
                    <Input id={`error-${variant}`} variant={variant} placeholder="Invalid input" aria-invalid="true" />
                    <p className="text-xs text-destructive">This field has an error</p>
                </div>
            ))}
        </div>
    ),
};
