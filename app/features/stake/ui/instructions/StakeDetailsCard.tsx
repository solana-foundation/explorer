import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import type { InstructionNode } from '@entities/instruction-card';
import type { ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import {
    AuthorizeCheckedInfo,
    AuthorizeCheckedWithSeedInfo,
    AuthorizeInfo,
    AuthorizeWithSeedInfo,
    DeactivateDelinquentInfo,
    DeactivateInfo,
    DelegateInfo,
    InitializeCheckedInfo,
    InitializeInfo,
    MergeInfo,
    MoveLamportsInfo,
    MoveStakeInfo,
    SetLockupCheckedInfo,
    SetLockupInfo,
    SplitInfo,
    WithdrawInfo,
} from '../../lib/instruction-types';
import { AuthorizeCheckedDetailsCard } from './AuthorizeCheckedDetailsCard';
import { AuthorizeDetailsCard } from './AuthorizeDetailsCard';
import { AuthorizeCheckedWithSeedDetailsCard, AuthorizeWithSeedDetailsCard } from './AuthorizeWithSeedDetailsCard';
import { DeactivateDelinquentDetailsCard } from './DeactivateDelinquentDetailsCard';
import { DeactivateDetailsCard } from './DeactivateDetailsCard';
import { DelegateDetailsCard } from './DelegateDetailsCard';
import { GetMinimumDelegationDetailsCard } from './GetMinimumDelegationDetailsCard';
import { InitializeCheckedDetailsCard } from './InitializeCheckedDetailsCard';
import { InitializeDetailsCard } from './InitializeDetailsCard';
import { MergeDetailsCard } from './MergeDetailsCard';
import { MoveLamportsDetailsCard, MoveStakeDetailsCard } from './MoveDetailsCard';
import { SetLockupCheckedDetailsCard, SetLockupDetailsCard } from './SetLockupDetailsCard';
import { SplitDetailsCard } from './SplitDetailsCard';
import { WithdrawDetailsCard } from './WithdrawDetailsCard';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function StakeDetailsCard(props: DetailsProps) {
    const node: InstructionNode = {
        childIndex: props.childIndex,
        index: props.index,
        innerCards: props.innerCards,
        ix: props.ix,
        programId: props.ix.programId,
    };

    // TODO: Replace this try/catch + Logger with a React error boundary one level up
    // (e.g. in InstructionCard). Reasons:
    //   1. try/catch in render code is a smell — error boundaries are React's answer.
    //   2. The catch is too broad: it conflates superstruct schema-validation failures
    //      from create() with downstream render errors in the child *DetailsCard, and
    //      reports both as "parse errors".
    //   3. The same pattern is duplicated across ~15 program cards (Vote, System,
    //      Wormhole, Serum, …). A single boundary centralizes the fallback + logging
    //      and keeps observability concerns out of UI components.
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);

        switch (parsed.type) {
            case 'initialize': {
                const info = create(parsed.info, InitializeInfo);
                return <InitializeDetailsCard info={info} node={node} />;
            }
            case 'delegate': {
                const info = create(parsed.info, DelegateInfo);
                return <DelegateDetailsCard info={info} node={node} />;
            }
            case 'authorize': {
                const info = create(parsed.info, AuthorizeInfo);
                return <AuthorizeDetailsCard info={info} node={node} />;
            }
            case 'split': {
                const info = create(parsed.info, SplitInfo);
                return <SplitDetailsCard info={info} node={node} />;
            }
            case 'withdraw': {
                const info = create(parsed.info, WithdrawInfo);
                return <WithdrawDetailsCard info={info} node={node} />;
            }
            case 'deactivate': {
                const info = create(parsed.info, DeactivateInfo);
                return <DeactivateDetailsCard info={info} node={node} />;
            }
            case 'merge': {
                const info = create(parsed.info, MergeInfo);
                return <MergeDetailsCard info={info} node={node} />;
            }
            case 'setLockup': {
                const info = create(parsed.info, SetLockupInfo);
                return <SetLockupDetailsCard info={info} node={node} />;
            }
            case 'setLockupChecked': {
                const info = create(parsed.info, SetLockupCheckedInfo);
                return <SetLockupCheckedDetailsCard info={info} node={node} />;
            }
            case 'authorizeWithSeed': {
                const info = create(parsed.info, AuthorizeWithSeedInfo);
                return <AuthorizeWithSeedDetailsCard info={info} node={node} />;
            }
            case 'authorizeCheckedWithSeed': {
                const info = create(parsed.info, AuthorizeCheckedWithSeedInfo);
                return <AuthorizeCheckedWithSeedDetailsCard info={info} node={node} />;
            }
            case 'initializeChecked': {
                const info = create(parsed.info, InitializeCheckedInfo);
                return <InitializeCheckedDetailsCard info={info} node={node} />;
            }
            case 'authorizeChecked': {
                const info = create(parsed.info, AuthorizeCheckedInfo);
                return <AuthorizeCheckedDetailsCard info={info} node={node} />;
            }
            case 'moveStake': {
                const info = create(parsed.info, MoveStakeInfo);
                return <MoveStakeDetailsCard info={info} node={node} />;
            }
            case 'moveLamports': {
                const info = create(parsed.info, MoveLamportsInfo);
                return <MoveLamportsDetailsCard info={info} node={node} />;
            }
            case 'deactivateDelinquent': {
                const info = create(parsed.info, DeactivateDelinquentInfo);
                return <DeactivateDelinquentDetailsCard info={info} node={node} />;
            }
            case 'getMinimumDelegation': {
                return <GetMinimumDelegationDetailsCard node={node} />;
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
