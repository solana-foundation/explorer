/**
 * Decorators and helpers for responsive Storybook variants (Mobile/Tablet) and stories that
 * need to mock Solana RPC. Kept in its own file so the @solana/web3.js Connection class isn't
 * pulled into every story via the main decorators.tsx.
 */
import { Connection } from '@solana/web3.js';
import type { Decorator } from '@storybook/react';
import React from 'react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

const connectionProto = Connection.prototype as unknown as Record<string, unknown>;
const stubbedNull = async () => null;
const stubbedNumber = async () => 0;
const stubbedArray = async () => [];
const rpcMethodStubs: Record<string, unknown> = {
    getAccountInfo: stubbedNull,
    getBalance: stubbedNumber,
    getBlockHeight: stubbedNumber,
    getMultipleAccountsInfo: stubbedArray,
    getParsedAccountInfo: stubbedNull,
    getParsedTokenAccountsByOwner: stubbedArray,
    getParsedTransaction: stubbedNull,
    getSignaturesForAddress: stubbedArray,
    getSlot: stubbedNumber,
    getTransaction: stubbedNull,
};

/**
 * Stubs `@solana/web3.js` Connection RPC methods on prototype so stories that render
 * TransactionHistoryCard / etc. don't hit a real Solana RPC. Activates on first story render
 * and stays active for the session.
 */
export const withMockRpc: Decorator = Story => {
    for (const [method, stub] of Object.entries(rpcMethodStubs)) {
        connectionProto[method] = stub;
    }
    return <Story />;
};

/**
 * Reads the viewport global (set via `globals: { viewport: { value: 'iphonex' } }`) and constrains
 * the story width to that viewport's dimensions. Width-only — the Storybook viewport addon already
 * sizes the canvas iframe (height + width, device emulation); this decorator complements it by
 * applying the same width in docs (where the addon doesn't size). Height stays natural.
 */
export const withViewportFromGlobal: Decorator = (Story, context) => {
    const viewport = context.globals.viewport;
    const key = typeof viewport === 'object' ? viewport?.value : viewport;
    const isRotated = typeof viewport === 'object' ? viewport?.isRotated : false;
    const def = key
        ? (INITIAL_VIEWPORTS as Record<string, { styles: { width: string; height: string } }>)[key]
        : undefined;
    if (!def) return <Story />;
    const width = isRotated ? def.styles.height : def.styles.width;
    return (
        <div style={{ margin: '0 auto', width }}>
            <Story />
        </div>
    );
};

export { INITIAL_VIEWPORTS };
