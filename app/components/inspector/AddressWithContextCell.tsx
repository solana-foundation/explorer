import type { AddressCell } from '@features/decode-instruction-associated-token';
import React from 'react';

import { AddressWithContext } from './AddressWithContext';

/**
 * Address renderer for instruction cards shown in the inspector. Unlike the
 * transaction page — which links out to the account — the inspector resolves the
 * address against the transaction under inspection.
 */
export const AddressWithContextCell: AddressCell = ({ pubkey }) => <AddressWithContext pubkey={pubkey} hideInfo />;
