import { type InstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import type { ParsedInstruction } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

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
    node: InstructionNode;
    ix: ParsedInstruction;
};

export function StakeDetailsCard({ node, ix }: DetailsProps) {
    const parsed = create(ix.parsed, ParsedInfo);

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
            return <UnknownDetailsCard node={node} />;
    }
}
