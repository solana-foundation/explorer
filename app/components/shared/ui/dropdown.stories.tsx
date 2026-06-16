import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown } from 'react-feather';

import { Button } from './button';
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from './dropdown';

// Each variant has a closed story (matches the legacy Bootstrap-shim baseline, where the menu
// never opened in capture) and an `… open` story passing `defaultOpen` so the menu pixels are
// screenshot-controlled. Interactive toggle/outside-click/Escape behavior is owned by the
// Dropdown root (no Bootstrap JS).
const meta = {
    component: Dropdown,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/Dropdown',
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultExample = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
    <Dropdown defaultOpen={defaultOpen}>
        <DropdownToggle asChild>
            <Button ui="dashkit" variant="white" size="sm" type="button">
                Toggle <ChevronDown className="align-text-top" size={13} />
            </Button>
        </DropdownToggle>
        <DropdownMenu>
            <DropdownItem>First item</DropdownItem>
            <DropdownItem>Second item</DropdownItem>
            <DropdownItem>Third item</DropdownItem>
        </DropdownMenu>
    </Dropdown>
);

export const Default: Story = {
    render: () => <DefaultExample />,
};

export const DefaultOpen: Story = {
    name: 'Default open',
    render: () => <DefaultExample defaultOpen />,
};

// `align="end"` adds `.dropdown-menu-end` so the menu right-aligns to the trigger.
const AlignEndExample = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
    <div className="flex justify-end">
        <Dropdown defaultOpen={defaultOpen}>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="white" size="sm" type="button">
                    Toggle <ChevronDown className="align-text-top" size={13} />
                </Button>
            </DropdownToggle>
            <DropdownMenu align="end">
                <DropdownItem>First item</DropdownItem>
                <DropdownItem>Second item</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    </div>
);

export const AlignEnd: Story = {
    name: 'Align end',
    render: () => <AlignEndExample />,
};

export const AlignEndOpen: Story = {
    name: 'Align end open',
    render: () => <AlignEndExample defaultOpen />,
};

// Mirrors the Block-history "Filter: All" pattern — scrolling capped at 20rem (max-h-80).
const ScrollingMenuExample = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
    <Dropdown defaultOpen={defaultOpen}>
        <DropdownToggle asChild>
            <Button ui="dashkit" variant="white" size="sm" type="button">
                Filter: All <ChevronDown className="align-text-top" size={13} />
            </Button>
        </DropdownToggle>
        <DropdownMenu align="end" className="max-h-80 overflow-y-auto">
            {Array.from({ length: 30 }, (_, i) => (
                <DropdownItem key={i}>Filter option #{i + 1}</DropdownItem>
            ))}
        </DropdownMenu>
    </Dropdown>
);

export const ScrollingMenu: Story = {
    name: 'Scrolling menu (token-filter)',
    render: () => <ScrollingMenuExample />,
};

export const ScrollingMenuOpen: Story = {
    name: 'Scrolling menu (token-filter) open',
    render: () => <ScrollingMenuExample defaultOpen />,
};

// Mirrors the creators dropdown — header row + entry rows. The custom `.creator-dropdown-*` SCSS
// rules are inlined as Tailwind utilities at the callsite (see MetaplexNFTHeader.tsx).
const WithHeaderAndItemsExample = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
    <Dropdown defaultOpen={defaultOpen}>
        <DropdownToggle asChild>
            <Button ui="dashkit" variant="dark" size="sm" className="w-[150px]" type="button">
                Creators <ChevronDown className="align-text-top" size={15} />
            </Button>
        </DropdownToggle>
        <DropdownMenu className="mt-1.5">
            <DropdownHeader className="flex flex-wrap items-center">
                <div className="flex max-w-[80%] grow-0 basis-[80%] font-mono">Creator Address</div>
                <div className="flex font-mono">Royalty</div>
            </DropdownHeader>
            {[
                { address: '5K6T6t38LcAovuTb1ydJrvT1z2dKnemR82YQiYrSwGjA', share: 75 },
                { address: 'CY3qBe1jXp4iGsbz4xVe2u7QJYTcQy81HhmrcSgyV8mJ', share: 25 },
            ].map(creator => (
                <div key={creator.address} className="ml-3 mr-3 flex flex-wrap items-center font-mono">
                    <DropdownItem className="max-w-[80%] grow-0 basis-[80%] overflow-hidden text-ellipsis font-mono">
                        {creator.address}
                    </DropdownItem>
                    <div className="mr-3">{creator.share}%</div>
                </div>
            ))}
        </DropdownMenu>
    </Dropdown>
);

export const WithHeaderAndItems: Story = {
    name: 'With header + items',
    render: () => <WithHeaderAndItemsExample />,
};

export const WithHeaderAndItemsOpen: Story = {
    name: 'With header + items open',
    render: () => <WithHeaderAndItemsExample defaultOpen />,
};

// `asChild` lets a DropdownItem wrap an existing `<a>` / `<Link>` so the className+styling apply
// to the link element directly (instead of nesting <a> inside a div).
const AsChildLinkExample = ({ defaultOpen = false }: { defaultOpen?: boolean }) => (
    <Dropdown defaultOpen={defaultOpen}>
        <DropdownToggle asChild>
            <Button ui="dashkit" variant="white" size="sm" type="button">
                Toggle <ChevronDown className="align-text-top" size={13} />
            </Button>
        </DropdownToggle>
        <DropdownMenu>
            <DropdownItem asChild>
                <a href="#first">First link</a>
            </DropdownItem>
            <DropdownItem asChild>
                <a href="#second" className="active">
                    Second link (active)
                </a>
            </DropdownItem>
        </DropdownMenu>
    </Dropdown>
);

export const AsChildLink: Story = {
    name: 'asChild link',
    render: () => <AsChildLinkExample />,
};

export const AsChildLinkOpen: Story = {
    name: 'asChild link open',
    render: () => <AsChildLinkExample defaultOpen />,
};
