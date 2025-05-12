import { parseInstruction } from '@codama/dynamic-parsers';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SignatureResult } from '@solana/web3.js';
import React from 'react';
import { isWritableRole } from 'web3js-experimental';
import { isSignerRole } from 'web3js-experimental';

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
                    <div className="me-2 d-md-inline">{accountName}</div>
                    {isWritable && <span className="badge bg-danger-soft me-1">Writable</span>}
                    {isSigner && <span className="badge bg-info-soft me-1">Signer</span>}
                </td>
                <td className="text-lg-end" colSpan={2}>
                    <Address pubkey={new PublicKey(account.address)} alignRight link />
                </td>
            </tr>,
        );
    }

    return (
        <InstructionCard title={ixTitle} ix={ix} result={result} index={index} innerCards={innerCards}>
            <tr>
                <td>Program</td>
                <td className="text-lg-end" colSpan={2}>
                    <Address pubkey={new PublicKey(ix.programId)} alignRight link raw overrideText={programName} />
                </td>
            </tr>
            <tr className="table-sep">
                <td>Account Name</td>
                <td className="text-lg-end" colSpan={2}>
                    Address
                </td>
            </tr>
            {accountDetails}
            {parsedIx.data ? (
                <>
                    <tr className="table-sep">
                        <td>Argument Name</td>
                        <td>Type</td>
                        <td className="text-lg-end">Value</td>
                    </tr>
                    {mapCodamaIxArgsToRows(parsedIx.data)}
                </>
            ) : null}
        </InstructionCard>
    );
}
