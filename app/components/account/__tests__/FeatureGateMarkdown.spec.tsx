import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeatureGateMarkdown } from '@/app/components/account/FeatureGateMarkdown';

const SIMD_URL =
    'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-efficient-token-program.md';

describe('FeatureGateMarkdown', () => {
    it('should wrap a table in a container that scrolls it sideways', () => {
        render(
            <FeatureGateMarkdown>
                {['| Instruction | CU |', '| --- | --- |', '| `Transfer` | 76 |'].join('\n')}
            </FeatureGateMarkdown>,
        );

        // eslint-disable-next-line testing-library/no-node-access -- the scroll container is the table's parent, which has no role
        expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
        expect(screen.getByRole('cell', { name: 'Transfer' })).toBeInTheDocument();
    });

    it('should open an external link in a new tab without an opener', () => {
        render(
            <FeatureGateMarkdown>
                {'See [the audit](https://github.com/anza-xyz/security-audits).'}
            </FeatureGateMarkdown>,
        );

        const link = screen.getByRole('link', { name: 'the audit' });
        expect(link).toHaveAttribute('href', 'https://github.com/anza-xyz/security-audits');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should keep an in-page anchor in the same tab and point it at the heading', () => {
        render(<FeatureGateMarkdown>{['See [Notes](#notes).', '', '## Notes'].join('\n')}</FeatureGateMarkdown>);

        const link = screen.getByRole('link', { name: 'Notes' });
        expect(link).toHaveAttribute('href', '#notes');
        expect(link).not.toHaveAttribute('target');
        expect(screen.getByRole('heading', { level: 2, name: 'Notes' })).toHaveAttribute('id', 'notes');
    });

    it('should resolve a link to a sibling proposal against the proposal URL', () => {
        render(
            <FeatureGateMarkdown baseUrl={SIMD_URL}>
                {'Builds on [SIMD-0088](./0088-enable-core-bpf-programs.md).'}
            </FeatureGateMarkdown>,
        );

        expect(screen.getByRole('link', { name: 'SIMD-0088' })).toHaveAttribute(
            'href',
            'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0088-enable-core-bpf-programs.md',
        );
    });

    it('should drop a javascript: link target', () => {
        render(<FeatureGateMarkdown baseUrl={SIMD_URL}>{'[click](javascript:alert(1))'}</FeatureGateMarkdown>);

        expect(screen.getByText('click')).not.toHaveAttribute('href');
    });

    it('should hide the YAML frontmatter', () => {
        render(
            <FeatureGateMarkdown>{['---', "simd: '0266'", '---', '', '## Summary'].join('\n')}</FeatureGateMarkdown>,
        );

        expect(screen.queryByText('0266', { exact: false })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    });
});
