import { beforeAll, vi } from 'vitest';
import { setProjectAnnotations } from '@storybook/experimental-nextjs-vite';
import * as projectAnnotations from './preview';

// vi.mock('child_process', () => ({
//     spawn: () => ({
//         stdout: { on: (_: string, cb: (data: Buffer) => void) => cb(Buffer.from('')) },
//         on: (_: string, cb: () => void) => cb(),
//     }),
//     spawnSync: () => ({ stdout: Buffer.from(''), status: 0 }),
// }));

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
