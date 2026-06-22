/**
 * Decorators and helpers for responsive Storybook variants (Mobile/Tablet) and stories that
 * need to mock Solana RPC. Kept in its own file so the @solana/web3.js Connection class isn't
 * pulled into every story via the main decorators.tsx.
 */
import { Connection } from '@solana/web3.js';
import React from 'react';
import { INITIAL_VIEWPORTS, type InitialViewportKeys } from 'storybook/viewport';

import type { Decorator, StoryContext } from './types';

const stubbedUndefined = async () => undefined;
const stubbedNumber = async () => 0;
const stubbedArray = async () => [];
const rpcMethodStubs: Record<string, unknown> = {
    getAccountInfo: stubbedUndefined,
    getBalance: stubbedNumber,
    getBlockHeight: stubbedNumber,
    getMultipleAccountsInfo: stubbedArray,
    getParsedAccountInfo: stubbedUndefined,
    getParsedTokenAccountsByOwner: stubbedArray,
    getParsedTransaction: stubbedUndefined,
    getSignaturesForAddress: stubbedArray,
    getSlot: stubbedNumber,
    getTransaction: stubbedUndefined,
};

/**
 * Stubs `@solana/web3.js` Connection RPC methods on prototype so stories that render
 * TransactionHistoryCard / etc. don't hit a real Solana RPC. Activates on first story render
 * and stays active for the session.
 */
export const withMockRpc: Decorator = Story => {
    Object.assign(Connection.prototype, rpcMethodStubs);
    return <Story />;
};

const isInitialViewportKey = (key: string): key is InitialViewportKeys => key in INITIAL_VIEWPORTS;

/**
 * Shared resolver so `withViewportFromGlobal` and `withFixedContainer` agree on which preset is
 * active — drift between them would render the wrapper width and the containing-block height
 * against different viewports.
 */
function getViewportStyles(
    context: StoryContext,
    fallbackKey?: InitialViewportKeys,
): { width: string; height: string } | undefined {
    const viewport = context.globals.viewport;
    const key = typeof viewport === 'object' ? viewport?.value : viewport;
    const isRotated = typeof viewport === 'object' ? viewport?.isRotated : false;
    const def =
        key && isInitialViewportKey(key)
            ? INITIAL_VIEWPORTS[key]
            : fallbackKey
              ? INITIAL_VIEWPORTS[fallbackKey]
              : undefined;
    if (!def) return undefined;
    return {
        height: isRotated ? def.styles.width : def.styles.height,
        width: isRotated ? def.styles.height : def.styles.width,
    };
}

/**
 * Width clamp for docs view only — the storybook viewport addon already sizes the iframe in
 * story view, so applying a wrapper there would double-set width and clip the padded canvas.
 *
 * Usage: `decorators: [withViewportFromGlobal]` on the meta of any responsive story that needs
 * its docs preview tile to render at the active viewport's natural width.
 */
export const withViewportFromGlobal: Decorator = (Story, context) => {
    if (context.viewMode !== 'docs') return <Story />;
    const styles = getViewportStyles(context);
    if (!styles) return <Story />;
    return (
        <div style={{ margin: '0 auto', width: styles.width }}>
            <Story />
        </div>
    );
};

/**
 * Containing-block wrapper for `position: fixed` children — without it, a fixed overlay anchors
 * to the storybook iframe viewport and escapes the docs preview tile entirely (per-story canvas
 * appears empty). `transform: translateZ(0)` creates the containing block; height tracks the
 * active viewport so the overlay's relative positioning matches the device preset.
 *
 * Usage: `decorators: [withFixedContainer]` on the meta of any story whose component renders a
 * `position: fixed` overlay (modals, sticky banners, drawers).
 */
export const withFixedContainer: Decorator = (Story, context) => {
    // Docs view only — in story view the overlay must anchor to the iframe viewport itself.
    if (context.viewMode !== 'docs') return <Story />;
    const styles = getViewportStyles(context, 'iphonex');
    return (
        <div className="relative w-full" style={{ height: styles?.height, transform: 'translateZ(0)' }}>
            <Story />
        </div>
    );
};

export { INITIAL_VIEWPORTS };
