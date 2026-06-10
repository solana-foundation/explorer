import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown } from 'react-feather';

import { Button } from './button';
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from './dropdown';

// Stories pass `defaultOpen` so the menu is visible for screenshot capture; interactive
// toggle/outside-click/Escape behavior is owned by the Dropdown root (no Bootstrap JS).
const meta = {
    component: Dropdown,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Dropdown',
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Dropdown defaultOpen>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="white" size="sm" type="button">
                    Toggle <ChevronDown className="e-align-text-top" size={13} />
                </Button>
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem>First item</DropdownItem>
                <DropdownItem>Second item</DropdownItem>
                <DropdownItem>Third item</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    ),
};

// `align="end"` adds `.e-dropdown-menu-end` so the menu right-aligns to the trigger.
export const AlignEnd: Story = {
    name: 'Align end',
    render: () => (
        <div className="e-flex e-justify-end">
            <Dropdown defaultOpen>
                <DropdownToggle asChild>
                    <Button ui="dashkit" variant="white" size="sm" type="button">
                        Toggle <ChevronDown className="e-align-text-top" size={13} />
                    </Button>
                </DropdownToggle>
                <DropdownMenu align="end">
                    <DropdownItem>First item</DropdownItem>
                    <DropdownItem>Second item</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    ),
};

// Mirrors the Block-history "Filter: All" pattern — scrolling capped at 20rem (e-max-h-80).
export const ScrollingMenu: Story = {
    name: 'Scrolling menu (token-filter)',
    render: () => (
        <Dropdown defaultOpen>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="white" size="sm" type="button">
                    Filter: All <ChevronDown className="e-align-text-top" size={13} />
                </Button>
            </DropdownToggle>
            <DropdownMenu align="end" className="e-max-h-80 e-overflow-y-auto">
                {Array.from({ length: 30 }, (_, i) => (
                    <DropdownItem key={i}>Filter option #{i + 1}</DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    ),
};

// Mirrors the creators dropdown — header row + entry rows. The custom `.creator-dropdown-*` SCSS
// rules are inlined as Tailwind utilities at the callsite (see MetaplexNFTHeader.tsx).
export const WithHeaderAndItems: Story = {
    name: 'With header + items',
    render: () => (
        <Dropdown defaultOpen>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="dark" size="sm" className="e-w-[150px]" type="button">
                    Creators <ChevronDown className="e-align-text-top" size={15} />
                </Button>
            </DropdownToggle>
            <DropdownMenu className="e-mt-1.5">
                <DropdownHeader className="e-flex e-flex-wrap e-items-center">
                    <div className="e-flex e-max-w-[80%] e-grow-0 e-basis-[80%] e-font-mono">Creator Address</div>
                    <div className="e-flex e-font-mono">Royalty</div>
                </DropdownHeader>
                {[
                    { address: '5K6T6t38LcAovuTb1ydJrvT1z2dKnemR82YQiYrSwGjA', share: 75 },
                    { address: 'CY3qBe1jXp4iGsbz4xVe2u7QJYTcQy81HhmrcSgyV8mJ', share: 25 },
                ].map(creator => (
                    <div key={creator.address} className="e-ml-3 e-mr-3 e-flex e-flex-wrap e-items-center e-font-mono">
                        <DropdownItem className="e-max-w-[80%] e-grow-0 e-basis-[80%] e-overflow-hidden e-text-ellipsis e-font-mono">
                            {creator.address}
                        </DropdownItem>
                        <div className="e-mr-3">{creator.share}%</div>
                    </div>
                ))}
            </DropdownMenu>
        </Dropdown>
    ),
};

// `asChild` lets a DropdownItem wrap an existing `<a>` / `<Link>` so the className+styling apply
// to the link element directly (instead of nesting <a> inside a div).
export const AsChildLink: Story = {
    name: 'asChild link',
    render: () => (
        <Dropdown defaultOpen>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="white" size="sm" type="button">
                    Toggle <ChevronDown className="e-align-text-top" size={13} />
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
    ),
};
