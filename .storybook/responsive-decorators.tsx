/**
 * Decorators and helpers for responsive Storybook variants (Mobile/Tablet) and stories that
 * need to mock Solana RPC. Kept in its own file so the @solana/web3.js Connection class isn't
 * pulled into every story via the main decorators.tsx.
 */
import { Connection } from '@solana/web3.js';
import type { Decorator } from '@storybook/react';
import React from 'react';
import { INITIAL_VIEWPORTS, type InitialViewportKeys } from 'storybook/viewport';

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
 * Reads the viewport global (set via `globals: { viewport: { value: 'iphonex' } }`) and constrains
 * the story width to that viewport's dimensions in docs view only. The Storybook viewport addon
 * already sizes the canvas iframe (height + width, device emulation) in story view, so adding a
 * fixed-width wrapper there would double-set the width and clip against the padded canvas.
 * Height stays natural.
 */
export const withViewportFromGlobal: Decorator = (Story, context) => {
    // In standalone story view the addon already sizes the iframe; only constrain in docs view.
    if (context.viewMode !== 'docs') return <Story />;

    const viewport = context.globals.viewport;
    const key = typeof viewport === 'object' ? viewport?.value : viewport;
    const isRotated = typeof viewport === 'object' ? viewport?.isRotated : false;
    const def = key && isInitialViewportKey(key) ? INITIAL_VIEWPORTS[key] : undefined;
    if (!def) return <Story />;
    const width = isRotated ? def.styles.height : def.styles.width;
    return (
        <div style={{ margin: '0 auto', width }}>
            <Story />
        </div>
    );
};

export { INITIAL_VIEWPORTS };
