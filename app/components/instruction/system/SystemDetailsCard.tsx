import type { InstructionNode } from '@entities/instruction-card';
import { ParsedInstruction, ParsedTransaction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { UnknownDetailsCard } from '../UnknownDetailsCard';
import { AllocateDetailsCard } from './AllocateDetailsCard';
import { AllocateWithSeedDetailsCard } from './AllocateWithSeedDetailsCard';
import { AssignDetailsCard } from './AssignDetailsCard';
import { AssignWithSeedDetailsCard } from './AssignWithSeedDetailsCard';
import { CreateDetailsCard } from './CreateDetailsCard';
import { CreateWithSeedDetailsCard } from './CreateWithSeedDetailsCard';
import { NonceAdvanceDetailsCard } from './NonceAdvanceDetailsCard';
import { NonceAuthorizeDetailsCard } from './NonceAuthorizeDetailsCard';
import { NonceInitializeDetailsCard } from './NonceInitializeDetailsCard';
import { NonceWithdrawDetailsCard } from './NonceWithdrawDetailsCard';
import { TransferDetailsCard } from './TransferDetailsCard';
import { TransferWithSeedDetailsCard } from './TransferWithSeedDetailsCard';
import {
    AdvanceNonceInfo,
    AllocateInfo,
    AllocateWithSeedInfo,
    AssignInfo,
    AssignWithSeedInfo,
    AuthorizeNonceInfo,
    CreateAccountInfo,
    CreateAccountWithSeedInfo,
    InitializeNonceInfo,
    TransferInfo,
    TransferWithSeedInfo,
    UpgradeNonceInfo,
    WithdrawNonceInfo,
} from './types';
import { UpgradeNonceDetailsCard } from './UpgradeNonceDetailsCard';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
    // Raw instruction for displaying accounts and hex data in raw mode (used by inspector)
    raw?: TransactionInstruction;
};

export function SystemDetailsCard(props: DetailsProps) {
    // Transitional. Every System card now takes a single `node`, but the two
    // `InstructionsSection`s still hand this component the old prop spread. This
    // shim disappears once they build the node tree themselves.
    const node: InstructionNode = {
        childIndex: props.childIndex,
        index: props.index,
        innerCards: props.innerCards,
        ix: props.ix,
        programId: props.ix.programId,
        raw: props.raw,
    };

    try {
        const parsed = create(props.ix.parsed, ParsedInfo);
        switch (parsed.type) {
            case 'createAccount': {
                const info = create(parsed.info, CreateAccountInfo);
                return <CreateDetailsCard info={info} node={node} />;
            }
            case 'createAccountWithSeed': {
                const info = create(parsed.info, CreateAccountWithSeedInfo);
                return <CreateWithSeedDetailsCard info={info} node={node} />;
            }
            case 'allocate': {
                const info = create(parsed.info, AllocateInfo);
                return <AllocateDetailsCard info={info} node={node} />;
            }
            case 'allocateWithSeed': {
                const info = create(parsed.info, AllocateWithSeedInfo);
                return <AllocateWithSeedDetailsCard info={info} node={node} />;
            }
            case 'assign': {
                const info = create(parsed.info, AssignInfo);
                return <AssignDetailsCard info={info} node={node} />;
            }
            case 'assignWithSeed': {
                const info = create(parsed.info, AssignWithSeedInfo);
                return <AssignWithSeedDetailsCard info={info} node={node} />;
            }
            case 'transfer': {
                const info = create(parsed.info, TransferInfo);
                return <TransferDetailsCard info={info} node={node} />;
            }
            case 'advanceNonce': {
                const info = create(parsed.info, AdvanceNonceInfo);
                return <NonceAdvanceDetailsCard info={info} node={node} />;
            }
            case 'withdrawNonce': {
                const info = create(parsed.info, WithdrawNonceInfo);
                return <NonceWithdrawDetailsCard info={info} node={node} />;
            }
            case 'authorizeNonce': {
                const info = create(parsed.info, AuthorizeNonceInfo);
                return <NonceAuthorizeDetailsCard info={info} node={node} />;
            }
            case 'initializeNonce': {
                const info = create(parsed.info, InitializeNonceInfo);
                return <NonceInitializeDetailsCard info={info} node={node} />;
            }
            case 'transferWithSeed': {
                const info = create(parsed.info, TransferWithSeedInfo);
                return <TransferWithSeedDetailsCard info={info} node={node} />;
            }
            case 'upgradeNonce': {
                const info = create(parsed.info, UpgradeNonceInfo);
                return <UpgradeNonceDetailsCard info={info} node={node} />;
            }
            default:
                return <UnknownDetailsCard {...props} />;
        }
    } catch (error) {
        Logger.error(error, {
            signature: props.tx.signatures[0],
        });
        return <UnknownDetailsCard {...props} />;
    }
}
