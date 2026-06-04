import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { InitPriceParams, PriceType } from './program';

export default function InitPriceDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: InitPriceParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Pyth: Init Price Account"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="e-text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Funding Account</td>
                <td className="e-text-right">
                    <Address pubkey={info.fundingPubkey} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Price Account</td>
                <td className="e-text-right">
                    <Address pubkey={info.pricePubkey} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Exponent</td>
                <td className="e-text-right">{info.exponent}</td>
            </tr>

            <tr>
                <td>Price Type</td>
                <td className="e-text-right">{PriceType[info.priceType]}</td>
            </tr>
        </InstructionCard>
    );
}
