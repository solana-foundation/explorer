import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MainnetWarningDialog } from '../MainnetWarningDialog';

describe('MainnetWarningDialog', () => {
    it.each([
        [true, 1],
        [false, 0],
    ])(
        'should say that the transaction uses the custom IDL only when one is selected (isCustomIdl: %s)',
        (isCustomIdl, count) => {
            render(
                <MainnetWarningDialog
                    isCustomIdl={isCustomIdl}
                    open
                    onOpenChange={vi.fn()}
                    onConfirm={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.queryAllByText('uses your custom IDL', { exact: false })).toHaveLength(count);
        },
    );
});
