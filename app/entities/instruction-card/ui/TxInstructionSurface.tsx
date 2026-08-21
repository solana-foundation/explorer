'use client';

import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import type { SignatureResult } from '@solana/web3.js';
import React from 'react';

import type { InstructionAddressProps, InstructionSurface } from '../model/surface';
import { InstructionSurfaceProvider } from '../model/surface';

/** On the transaction page an address links out to its own account page. */
const TxAddress = ({ pubkey }: InstructionAddressProps) => <Address pubkey={pubkey} alignRight link />;

/**
 * Declares how instruction cards render on the transaction page.
 *
 * Lives here rather than in the transaction feature so tests that render a card
 * in isolation can pick a surface without reaching across layers. The inspector
 * declares its own surface next to its `InstructionsSection`, because
 * `InspectorInstructionCard` imports this entity's barrel and moving it here
 * would close an import cycle.
 */
export function TxInstructionSurface({ result, children }: { result: SignatureResult; children: React.ReactNode }) {
    const surface = React.useMemo<InstructionSurface>(
        () => ({
            Address: TxAddress,
            Shell: InstructionCard,
            result,
            // The tx-page shell renders no Program row of its own, so the fields do.
            showProgramField: true,
        }),
        [result],
    );

    return <InstructionSurfaceProvider surface={surface}>{children}</InstructionSurfaceProvider>;
}
