import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import * as a11yAnnotations from '@storybook/addon-a11y/preview';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([a11yAnnotations, projectAnnotations]);

// Set globalProjectAnnotations for addon-vitest compatibility
globalThis.globalProjectAnnotations = project;

beforeAll(async () => {
    // Small delay to allow browser runner to fully initialize
    // Workaround for: "Vitest failed to find the runner" race condition
    await new Promise(resolve => setTimeout(resolve, 100));

    if (project.beforeAll) {
        await project.beforeAll();
    }
});
