import { parseInstruction } from '@codama/dynamic-parsers';
import { isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SignatureResult } from '@solana/web3.js';
import React from 'react';

import { Address } from '../../common/Address';
import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import { mapCodamaIxArgsToRows } from './codamaUtils';

export function CodamaInstructionCard({
    ix,
    result,
    index,
    innerCards,
    parsedIx,
}: {
    ix: TransactionInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    parsedIx: ReturnType<typeof parseInstruction>;
}) {
    if (parsedIx?.path[0].kind !== 'rootNode') {
        return <UnknownDetailsCard ix={ix} result={result} index={index} innerCards={innerCards} />;
    }
    const rawProgramName = parsedIx?.path[0].program.name;
    const programName = rawProgramName.charAt(0).toUpperCase() + rawProgramName.slice(1);
    const lastNode = parsedIx?.path[parsedIx?.path.length - 1];
    if (lastNode.kind !== 'instructionNode') {
        return <UnknownDetailsCard ix={ix} result={result} index={index} innerCards={innerCards} />;
    }
    const instructionName = lastNode.name;
    const ixTitle = `${programName}: ${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)}`;

    const accounts = parsedIx?.accounts;

    const accountDetails = [];
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const isWritable = isWritableRole(account.role);
        const isSigner = isSignerRole(account.role);
        let accountName = `Account ${i + 1}`;
        if (account.name) {
            accountName = account.name.charAt(0).toUpperCase() + account.name.slice(1);
        }

        accountDetails.push(
            <tr key={i}>
                <td>
                    <div className="e-mr-1.5 md:e-inline">{accountName}</div>
                    {isWritable && <span className="badge bg-danger-soft e-mr-[3px]">Writable</span>}
                    {isSigner && <span className="badge bg-info-soft e-mr-[3px]">Signer</span>}
                </td>
                <td className="e-text-right" colSpan={2}>
                    <Address pubkey={new PublicKey(account.address)} alignRight link />
                </td>
            </tr>,
        );
    }

    return (
        <InstructionCard title={ixTitle} ix={ix} result={result} index={index} innerCards={innerCards}>
            <tr>
                <td>Program</td>
                <td className="e-text-right" colSpan={2}>
                    <Address pubkey={new PublicKey(ix.programId)} alignRight link raw overrideText={programName} />
                </td>
            </tr>
            <tr className="table-sep">
                <td>Account Name</td>
                <td className="e-text-right" colSpan={2}>
                    Address
                </td>
            </tr>
            {accountDetails}
            {parsedIx.data ? (
                <>
                    <tr className="table-sep">
                        <td>Argument Name</td>
                        <td>Type</td>
                        <td className="e-text-right">Value</td>
                    </tr>
                    {mapCodamaIxArgsToRows(parsedIx.data)}
                </>
            ) : null}
        </InstructionCard>
    );
}
