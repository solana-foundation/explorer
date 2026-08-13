import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { BaseDomainsCard } from '../BaseDomainsCard';

const meta = {
    component: BaseDomainsCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        docs: {
            description: {
                component: [
                    "Presentational card rendering an account's domains as a collapsible section — the heading",
                    'is lifted out above the card and a toggle collapses the list. This component only supplies',
                    'the copy and the per-row data; everything else is composed from the shared primitives below.',
                    '',
                    '## References',
                    '',
                    '- [CollapsibleSection](?path=/docs/components-shared-collapsiblesection--docs) — the shared collapsible wrapper: a `<section aria-labelledby>` with the heading (`<h2 className="m-0 text-lg font-normal text-white">`) lifted out above the surface, a `Collapse`/`Expand` toggle, and the height animation. Passed `className=""` so the surface comes from the `<Card>` below (the same pattern the transaction `InstructionsSection` uses).',
                    '- [Button](?path=/docs/components-shared-button--docs) (`variant="outline" size="sm"`) — the collapse/expand toggle inside `CollapsibleSection`: a rotating `ChevronDown` plus a `Collapse`/`Expand` label on `md+`, with `aria-expanded` reflecting state.',
                    '- Collapse animation — a `grid` wrapper toggling `grid-rows-[1fr]` ↔ `grid-rows-[0fr]` around an `overflow-hidden` child, so the list animates open/closed without fixed heights.',
                    '- [Card](?path=/docs/components-shared-card-basecard--docs) — the surface holding the list: a Tailwind `variant="tight"` card.',
                    '- Domain list — a pure-Tailwind CSS grid (`clamp(120px,25%,200px) 1fr`) built from `div`s, mirroring the transaction Accounts/Token Balances tables. Columns: "Domain" and "Name Service Account".',
                    '- [Address](?path=/docs/components-common-address--docs) (`link`) — fills the "Name Service Account" cell, rendering each domain\'s pubkey as a linked, copyable address with a tooltip.',
                    '- [LoadingCard](?path=/docs/components-common-loadingcard--docs) / [ErrorCard](?path=/docs/components-common-errorcard--docs) — not part of this card; rendered by the wrapping `DomainsCard` for the loading and error states.',
                ].join('\n'),
            },
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Entities/Domain/BaseDomainsCard',
} satisfies Meta<typeof BaseDomainsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Real long domain owned by Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v — its on-chain name-account
// key derived the same way as the app's fetch path. Hoisted so args and the `play` assertion share one
// source of truth for the (verbose) name.
const LONG_DOMAIN = {
    address: 'EXNHvjcrDi4hM634GxZsEGC5i9xhcuFqcPSTAY9XSXvb',
    name: 'thisisaverylongdomainnamemainlyusedforfunctionaltesting.sol',
};
// Synthetic name ~4× longer (the real label repeated four times) — no such domain is registered, so
// the address is a placeholder; it exists purely to see how an extreme value wraps/contains.
const EXTRA_LONG_DOMAIN = {
    address: 'So11111111111111111111111111111111111111112',
    name: 'thisisaverylongdomainnamemainlyusedforfunctionaltestingthisisaverylongdomainnamemainlyusedforfunctionaltestingthisisaverylongdomainnamemainlyusedforfunctionaltestingthisisaverylongdomainnamemainlyusedforfunctionaltesting.sol',
};

export const SingleDomain: Story = {
    args: {
        domains: [{ address: '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo', name: 'example.sol' }],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('example.sol')).toBeInTheDocument();
    },
};

export const MultipleDomains: Story = {
    args: {
        domains: [
            { address: '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo', name: 'example.sol' },
            { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', name: 'bob.sol' },
            { address: 'Sysvar1111111111111111111111111111111111111', name: 'charlie.ans' },
            LONG_DOMAIN,
            EXTRA_LONG_DOMAIN,
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('example.sol')).toBeInTheDocument();
        expect(canvas.getByText('bob.sol')).toBeInTheDocument();
        expect(canvas.getByText('charlie.ans')).toBeInTheDocument();
        expect(canvas.getByText(LONG_DOMAIN.name)).toBeInTheDocument();
        expect(canvas.getByText(EXTRA_LONG_DOMAIN.name)).toBeInTheDocument();
    },
};
