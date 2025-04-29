import { render, screen } from '@testing-library/react';
import React from 'react';
import { expect, test } from 'vitest';

import useTabVisibility from '../use-tab-visibility';

const isVisibleTestId = 'isVisible';

const App: React.FC = () => {
    const { visible } = useTabVisibility();

    return <div data-testid={isVisibleTestId} data-visible={visible} />;
};

test('detects visibility', async () => {
    render(<App />);

    const el = screen.getByTestId(isVisibleTestId);

    expect(el.dataset.visible).toBe('true');
});
