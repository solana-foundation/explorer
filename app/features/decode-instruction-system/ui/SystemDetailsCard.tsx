import type { InstructionNode } from '@entities/instruction-card';
import type { SystemParsed } from '@explorer/parsers/programs/system';

import { AllocateDetailsCard } from './AllocateDetailsCard';
import { AllocateWithSeedDetailsCard } from './AllocateWithSeedDetailsCard';
import { AssignDetailsCard } from './AssignDetailsCard';
import { AssignWithSeedDetailsCard } from './AssignWithSeedDetailsCard';
import { CreateAllowPrefundDetailsCard } from './CreateAllowPrefundDetailsCard';
import { CreateDetailsCard } from './CreateDetailsCard';
import { CreateWithSeedDetailsCard } from './CreateWithSeedDetailsCard';
import { NonceAdvanceDetailsCard } from './NonceAdvanceDetailsCard';
import { NonceAuthorizeDetailsCard } from './NonceAuthorizeDetailsCard';
import { NonceInitializeDetailsCard } from './NonceInitializeDetailsCard';
import { NonceWithdrawDetailsCard } from './NonceWithdrawDetailsCard';
import { TransferDetailsCard } from './TransferDetailsCard';
import { TransferWithSeedDetailsCard } from './TransferWithSeedDetailsCard';
import { UpgradeNonceDetailsCard } from './UpgradeNonceDetailsCard';

type DetailsProps = {
    node: InstructionNode;
    parsed: SystemParsed;
};

export function SystemDetailsCard({ node, parsed }: DetailsProps) {
    switch (parsed.type) {
        case 'createAccount':
            return <CreateDetailsCard info={parsed.info} node={node} />;
        case 'createAccountWithSeed':
            return <CreateWithSeedDetailsCard info={parsed.info} node={node} />;
        case 'createAccountAllowPrefund':
            return <CreateAllowPrefundDetailsCard info={parsed.info} node={node} />;
        case 'allocate':
            return <AllocateDetailsCard info={parsed.info} node={node} />;
        case 'allocateWithSeed':
            return <AllocateWithSeedDetailsCard info={parsed.info} node={node} />;
        case 'assign':
            return <AssignDetailsCard info={parsed.info} node={node} />;
        case 'assignWithSeed':
            return <AssignWithSeedDetailsCard info={parsed.info} node={node} />;
        case 'transfer':
            return <TransferDetailsCard info={parsed.info} node={node} />;
        case 'advanceNonce':
            return <NonceAdvanceDetailsCard info={parsed.info} node={node} />;
        case 'withdrawFromNonce':
            return <NonceWithdrawDetailsCard info={parsed.info} node={node} />;
        case 'authorizeNonce':
            return <NonceAuthorizeDetailsCard info={parsed.info} node={node} />;
        case 'initializeNonce':
            return <NonceInitializeDetailsCard info={parsed.info} node={node} />;
        case 'transferWithSeed':
            return <TransferWithSeedDetailsCard info={parsed.info} node={node} />;
        case 'upgradeNonce':
            return <UpgradeNonceDetailsCard info={parsed.info} node={node} />;
    }
}
