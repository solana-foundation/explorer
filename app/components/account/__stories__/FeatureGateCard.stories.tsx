import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { FeatureGateCard } from '../FeatureGateCard';
import { FeatureGateMarkdown } from '../FeatureGateMarkdown';
import { SIMD_0266_MARKDOWN, SIMD_0266_URL } from './feature-gate-fixtures';

const meta: Meta<typeof FeatureGateCard> = {
    component: FeatureGateCard,
    parameters: {
        docs: {
            description: {
                component: [
                    "A feature's SIMD proposal on the Feature Gate tab, as a collapsible section — the heading is",
                    'lifted out above the card and a toggle collapses the proposal. The card supplies the copy and',
                    'the surface; the proposal itself arrives as `children`, rendered by `FeatureGateMarkdown`.',
                    '',
                    '## References',
                    '',
                    '- [CollapsibleSection](?path=/docs/components-shared-collapsiblesection--docs) — the shared collapsible wrapper: a `<section aria-labelledby>` with the "Feature Information" heading lifted out above the surface, a `Collapse`/`Expand` toggle, and the height animation. Passed `className=""` so the surface comes from the `<Card>` below.',
                    '- [Button](?path=/docs/components-shared-button--docs) (`variant="outline" size="sm"`) — the collapse/expand toggle inside `CollapsibleSection`.',
                    '- [Card](?path=/docs/components-shared-card-basecard--docs) — the surface holding the proposal: a Tailwind `variant="tight"` card padded with `ROW_PADDING` below `md`, `p-6` from `md`.',
                    '- `FeatureGateMarkdown` — renders the proposal with `react-markdown` (`remark-gfm`, `remark-frontmatter`): headings h1–h6, paragraphs, nested lists, links, inline code, code blocks, quotes, tables and rules. Code blocks and tables scroll sideways inside themselves; long links and hashes wrap.',
                    '- [BaseTable](?path=/docs/components-shared-table-basetable--docs) (`density="dense" head="subtle"`) — every markdown table, inside a bordered wrapper that scrolls a wide table within the card.',
                ].join('\n'),
            },
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureGateCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: <FeatureGateMarkdown baseUrl={SIMD_0266_URL}>{SIMD_0266_MARKDOWN}</FeatureGateMarkdown>,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('heading', { name: 'Feature Information' })).toBeInTheDocument();
        expect(canvas.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
        expect(canvas.getAllByRole('table')).toHaveLength(3);
    },
};

// What the tab shows when the feature has no SIMD or GitHub does not answer: the page renders this in place
// of the proposal markdown.
export const Unavailable: Story = {
    args: {
        children: <p className="m-0 text-sm text-outer-space-300">Proposal text unavailable</p>,
    },
};
