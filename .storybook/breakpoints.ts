// Generates the breakpoint viewport badges from the single source of truth — the `breakpoints`
// Map in tailwind.config.ts. Widths come straight from there; the +1 mirrors getScreenDim (Tailwind
// screens are min-width = base + 1), so each badge lands on the breakpoint's activation point.
//
// tailwind.config's runtime deps (tailwindcss/plugin, tailwindcss-animate) are pure browser-safe
// functions, so importing it here is safe for the Storybook manager bundle too. height/type are
// storybook-only preview presentation and stay local — they are not breakpoint values.
import { breakpoints } from '../tailwind.config';

type ViewportType = 'desktop' | 'mobile' | 'tablet';

const META: Record<string, { height: number; type: ViewportType }> = {
    lg: { height: 768, type: 'desktop' },
    md: { height: 1024, type: 'tablet' },
    sm: { height: 812, type: 'mobile' },
    xl: { height: 900, type: 'desktop' },
    xs: { height: 667, type: 'mobile' },
    xxl: { height: 900, type: 'desktop' },
    xxs: { height: 568, type: 'mobile' },
};

const viewportKey = (name: string) => `bs${name.charAt(0).toUpperCase()}${name.slice(1)}`;

// [name, base] ascending so the toolbar and viewport dropdown read smallest → largest.
const entries = [...breakpoints.entries()].sort(([, a], [, b]) => a - b);

/** Toolbar quick-select chips (manager). `key` matches a BREAKPOINT_VIEWPORTS entry. */
export const BREAKPOINTS = entries.map(([name, base]) => ({ key: viewportKey(name), label: `${name}·${base + 1}` }));

/** Preview viewport badges. Spread into parameters.viewport.options alongside INITIAL_VIEWPORTS. */
export const BREAKPOINT_VIEWPORTS: Record<
    string,
    { name: string; styles: { height: string; width: string }; type: ViewportType }
> = Object.fromEntries(
    entries.map(([name, base]) => {
        const width = base + 1;
        const { height, type } = META[name] ?? { height: 900, type: 'desktop' };
        return [
            viewportKey(name),
            { name: `${name}·${width}`, styles: { height: `${height}px`, width: `${width}px` }, type },
        ];
    }),
);
