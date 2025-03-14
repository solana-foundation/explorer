import { Address } from '@components/common/Address';
import { ParsedInstruction, PublicKey, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';

export function CreateDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const info = ix.parsed.info;
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title="Associated Token Program: Create"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Source</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.source)} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Account</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.account)} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Mint</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.mint)} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Wallet</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.wallet)} alignRight link />
                </td>
            </tr>

            <tr>
                <td>System Program</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.systemProgram)} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(info.tokenProgram)} alignRight link />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
