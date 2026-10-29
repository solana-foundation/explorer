import { type InstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
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
    parsed: unknown;
};

export function StakeDetailsCard({ node, parsed }: DetailsProps) {
    const parsedInfo = create(parsed, ParsedInfo);

    switch (parsedInfo.type) {
        case 'initialize': {
            const info = create(parsedInfo.info, InitializeInfo);
            return <InitializeDetailsCard info={info} node={node} />;
        }
        case 'delegate': {
            const info = create(parsedInfo.info, DelegateInfo);
            return <DelegateDetailsCard info={info} node={node} />;
        }
        case 'authorize': {
            const info = create(parsedInfo.info, AuthorizeInfo);
            return <AuthorizeDetailsCard info={info} node={node} />;
        }
        case 'split': {
            const info = create(parsedInfo.info, SplitInfo);
            return <SplitDetailsCard info={info} node={node} />;
        }
        case 'withdraw': {
            const info = create(parsedInfo.info, WithdrawInfo);
            return <WithdrawDetailsCard info={info} node={node} />;
        }
        case 'deactivate': {
            const info = create(parsedInfo.info, DeactivateInfo);
            return <DeactivateDetailsCard info={info} node={node} />;
        }
        case 'merge': {
            const info = create(parsedInfo.info, MergeInfo);
            return <MergeDetailsCard info={info} node={node} />;
        }
        case 'setLockup': {
            const info = create(parsedInfo.info, SetLockupInfo);
            return <SetLockupDetailsCard info={info} node={node} />;
        }
        case 'setLockupChecked': {
            const info = create(parsedInfo.info, SetLockupCheckedInfo);
            return <SetLockupCheckedDetailsCard info={info} node={node} />;
        }
        case 'authorizeWithSeed': {
            const info = create(parsedInfo.info, AuthorizeWithSeedInfo);
            return <AuthorizeWithSeedDetailsCard info={info} node={node} />;
        }
        case 'authorizeCheckedWithSeed': {
            const info = create(parsedInfo.info, AuthorizeCheckedWithSeedInfo);
            return <AuthorizeCheckedWithSeedDetailsCard info={info} node={node} />;
        }
        case 'initializeChecked': {
            const info = create(parsedInfo.info, InitializeCheckedInfo);
            return <InitializeCheckedDetailsCard info={info} node={node} />;
        }
        case 'authorizeChecked': {
            const info = create(parsedInfo.info, AuthorizeCheckedInfo);
            return <AuthorizeCheckedDetailsCard info={info} node={node} />;
        }
        case 'moveStake': {
            const info = create(parsedInfo.info, MoveStakeInfo);
            return <MoveStakeDetailsCard info={info} node={node} />;
        }
        case 'moveLamports': {
            const info = create(parsedInfo.info, MoveLamportsInfo);
            return <MoveLamportsDetailsCard info={info} node={node} />;
        }
        case 'deactivateDelinquent': {
            const info = create(parsedInfo.info, DeactivateDelinquentInfo);
            return <DeactivateDelinquentDetailsCard info={info} node={node} />;
        }
        case 'getMinimumDelegation': {
            return <GetMinimumDelegationDetailsCard node={node} />;
        }
        default:
            return <UnknownDetailsCard node={node} />;
    }
}
