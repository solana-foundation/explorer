import './breakpoint-toolbar';

import { PREVIEW_KEYDOWN, STORIES_COLLAPSE_ALL } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

addons.setConfig({
    theme: themes.light,
});

// accordion sidebar: on Alt+Arrow navigation collapse the tree before the shortcut runs; the new selection re-expands its own path
addons.register('explorer/sidebar-accordion', api => {
    let entries: { id: string; title: string }[] = [];
    fetch('index.json')
        .then(res => res.json())
        .then((index: { entries: Record<string, { id: string; title: string }> }) => {
            entries = Object.values(index.entries).map(({ id, title }) => ({ id, title }));
        })
        .catch(() => {});

    const isStoryNavigation = (event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'key'>) =>
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.key);

    // at the first/last entry the shortcut is a no-op; collapsing then would hide the current selection
    const willNavigate = (key: string) => {
        if (entries.length === 0) return true;
        const { storyId } = api.getUrlState();
        const pos = entries.findIndex(e => e.id === storyId);
        if (pos < 0) return false;
        if (key === 'ArrowLeft') return pos > 0;
        if (key === 'ArrowRight') return pos < entries.length - 1;
        if (key === 'ArrowUp') return entries[pos].title !== entries[0].title;
        return entries[pos].title !== entries[entries.length - 1].title;
    };

    const collapseBeforeNavigation = (
        event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'key'>,
    ) => {
        if (isStoryNavigation(event) && willNavigate(event.key)) api.emit(STORIES_COLLAPSE_ALL);
    };

    document.addEventListener(
        'keydown',
        event => {
            const { target } = event;
            if (
                target instanceof HTMLElement &&
                (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)
            ) {
                return;
            }
            collapseBeforeNavigation(event);
        },
        // capture: collapse must dispatch before the built-in shortcut navigates
        true,
    );
    api.on(PREVIEW_KEYDOWN, (data: { event: KeyboardEvent }) => collapseBeforeNavigation(data.event));
});
