import { createRoot, type Root } from 'react-dom/client';
import { onTestFinished, vi } from 'vitest';

export function createRootWithoutAct(): Root {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
    const container = document.body.appendChild(document.createElement('div'));
    const root = createRoot(container);
    onTestFinished(() => {
        root.unmount();
        container.remove();
        vi.unstubAllGlobals();
    });
    return root;
}
