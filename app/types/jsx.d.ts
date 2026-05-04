// React 19 removed the global JSX namespace. This shim restores it so
// existing code that references `JSX.Element` continues to compile.
// Prefer `React.ReactNode` in new code — this file can be removed once
// all 80+ usages are migrated.
import type React from 'react';

declare global {
    namespace JSX {
        type Element = React.JSX.Element;
        type IntrinsicElements = React.JSX.IntrinsicElements;
    }
}
