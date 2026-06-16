import { parseInstruction } from '@codama/dynamic-parsers';
import { isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SignatureResult } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

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
            <BaseTable.Row key={i}>
                <BaseTable.Cell>
                    <div className="e-mr-1.5 md:e-inline">{accountName}</div>
                    {isWritable && (
                        <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                            Writable
                        </Badge>
                    )}
                    {isSigner && (
                        <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                            Signer
                        </Badge>
                    )}
                </BaseTable.Cell>
                <BaseTable.Cell className="e-text-right" colSpan={2}>
                    <Address pubkey={new PublicKey(account.address)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>,
        );
    }

    return (
        <InstructionCard title={ixTitle} ix={ix} result={result} index={index} innerCards={innerCards}>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right" colSpan={2}>
                    <Address pubkey={new PublicKey(ix.programId)} alignRight link raw overrideText={programName} />
                </BaseTable.Cell>
            </BaseTable.Row>
            {accountDetails.length > 0 && (
                <BaseTable.Row className="e-bg-dark-background e-text-dk-xs e-font-semibold e-uppercase e-tracking-[0.08em] e-text-dark-muted-foreground">
                    <BaseTable.Cell>Account Name</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right" colSpan={2}>
                        Address
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {accountDetails}
            {parsedIx.data ? (
                <>
                    <BaseTable.Row className="e-bg-dark-background e-text-dk-xs e-font-semibold e-uppercase e-tracking-[0.08em] e-text-dark-muted-foreground">
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">Value</BaseTable.Cell>
                    </BaseTable.Row>
                    {mapCodamaIxArgsToRows(parsedIx.data)}
                </>
            ) : null}
        </InstructionCard>
    );
}
