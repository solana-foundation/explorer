import { Button, type ButtonProps } from '@components/shared/ui/button';
import { Label } from '@components/shared/ui/label';
import { Switch } from '@components/shared/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import type {
    InstructionAccountData,
    InstructionData,
    NestedInstructionAccountsData,
    SupportedIdl,
} from '@entities/idl';
import { useWallet } from '@solana/wallet-adapter-react';
import { type ReactNode, useState } from 'react';
import { Loader, Play, Send } from 'react-feather';
import { Control, Controller, FieldPath } from 'react-hook-form';

import { Card, CardSection } from '@/app/shared/ui/Card';

import { createGetAutocompleteItems } from '../model/account-autocomplete/createGetAutocompleteItems';
import type { AutocompleteItem } from '../model/account-autocomplete/types';
import { createKnownAccountsPrefillDependency } from '../model/form-prefill/providers/known-accounts-prefill-provider';
import { usePdaPrefill } from '../model/form-prefill/providers/use-pda-prefill';
import { createWalletPrefillDependency } from '../model/form-prefill/providers/wallet-prefill-provider';
import { useFormPrefill } from '../model/form-prefill/use-form-prefill';
import type { ExecutionOptions } from '../model/transaction/types';
import type { InstructionStatus } from '../model/use-instruction';
import {
    type InstructionCallParams,
    type InstructionFormData,
    useInstructionForm,
} from '../model/use-instruction-form';
import { usePdas } from '../model/use-pdas';
import { AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import { AccountInput } from './AccountInput';
import { ArgumentInput } from './ArgumentInput';
import { WarningNote } from './WarningNote';

const WALLET_CONNECT_TOOLTIP = 'Connect your wallet to interact with this instruction';

// FIXME: missing Storybook story — uses useWallet + react-hook-form Controllers + nested IDL fixtures.
export function InteractInstruction({
    idl,
    instruction,
    onExecuteInstruction,
    onSimulateInstruction,
    status,
}: {
    idl: SupportedIdl | undefined;
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams, options: ExecutionOptions) => void;
    onSimulateInstruction: (data: InstructionData, params: InstructionCallParams) => void;
    instruction: InstructionData;
    status: InstructionStatus;
}) {
    const { connected: walletConnected, publicKey } = useWallet();
    const [simulateBeforeExecute, setSimulateBeforeExecute] = useState(true);

    const { form, onSubmit, onSimulate, validationRules, fieldNames } = useInstructionForm({
        instruction,
        onSimulate: params => {
            onSimulateInstruction(instruction, params);
        },
        onSubmit: params => {
            onExecuteInstruction(instruction, params, { simulate: simulateBeforeExecute });
        },
    });

    const pdas = usePdas({ form, idl, instruction });
    const getAutocompleteItems = createGetAutocompleteItems({ pdas, publicKey });

    const walletPrefillDependency = createWalletPrefillDependency(instruction, publicKey, fieldNames);
    const knownAccountsPrefillDependency = createKnownAccountsPrefillDependency(instruction, fieldNames);
    useFormPrefill({
        config: {
            externalDependencies: [walletPrefillDependency, knownAccountsPrefillDependency],
        },
        form,
    });
    usePdaPrefill({ fieldNames, form, instruction, pdas });

    const interactionDisabled = !walletConnected || status !== 'idle';

    return (
        <Card variant="tight">
            <AccordionItem value={instruction.name} className="">
                <AccordionTrigger>
                    <div className="flex w-full items-center justify-between">
                        <span className="min-w-0 flex-1 truncate pr-4 text-left text-sm font-medium text-white md:w-[170px] [@media(min-width:992px)]:w-[300px]">
                            {instruction.name}
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    {/* Instruction Documentation */}
                    {instruction.docs && instruction.docs.length > 0 && (
                        <div className="mb-4 rounded-lg bg-[#1a1b1d] p-3">
                            <p className="text-xs text-neutral-400">{instruction.docs.join(' ')}</p>
                        </div>
                    )}

                    {/* Arguments Section - shown first as accounts may depend on argument values */}
                    {instruction.args.length > 0 && (
                        <CardSection title="Arguments">
                            <div className="space-y-3 px-6">
                                {instruction.args.map(arg => (
                                    <Controller
                                        key={arg.name}
                                        name={fieldNames.argument(arg)}
                                        control={form.control}
                                        rules={validationRules.argument(arg)}
                                        render={({ field, fieldState: { error } }) => (
                                            <ArgumentInput
                                                {...field}
                                                value={
                                                    typeof field.value === 'string'
                                                        ? field.value
                                                        : String(field.value || '')
                                                }
                                                arg={arg}
                                                error={error}
                                            />
                                        )}
                                    />
                                ))}
                            </div>
                        </CardSection>
                    )}

                    {/* Accounts Section */}
                    {instruction.accounts.length > 0 && (
                        <CardSection title="Accounts">
                            <div className="space-y-3 px-6">
                                {instruction.accounts.map(account =>
                                    'accounts' in account ? (
                                        <NestedAccountGroup
                                            key={account.name}
                                            group={account}
                                            control={form.control}
                                            fieldNames={fieldNames}
                                            validationRules={validationRules}
                                            getAutocompleteItems={getAutocompleteItems}
                                            seeds={pdas[account.name]?.seeds || []}
                                        />
                                    ) : (
                                        <AccountController
                                            key={account.name}
                                            account={account}
                                            name={fieldNames.account(account)}
                                            control={form.control}
                                            rules={validationRules.account(account)}
                                            getAutocompleteItems={getAutocompleteItems}
                                            seeds={pdas[account.name]?.seeds || []}
                                        />
                                    ),
                                )}
                            </div>
                        </CardSection>
                    )}
                    <div className="px-6 pb-2.5">
                        <div className="flex gap-2">
                            <ActionButton
                                onClick={onSubmit}
                                disabled={interactionDisabled}
                                loading={status === 'executing'}
                                icon={<Send size={16} />}
                                label="Execute"
                                variant="accent"
                                tooltipText={!walletConnected ? WALLET_CONNECT_TOOLTIP : ''}
                            />
                            <ActionButton
                                onClick={onSimulate}
                                disabled={interactionDisabled}
                                loading={status === 'simulating'}
                                icon={<Play size={16} />}
                                label="Simulate"
                                variant="outline"
                                tooltipText={!walletConnected ? WALLET_CONNECT_TOOLTIP : ''}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Switch
                                id={`simulate-before-execute-${instruction.name}`}
                                data-testid="simulate-before-execute-toggle"
                                checked={simulateBeforeExecute}
                                onCheckedChange={setSimulateBeforeExecute}
                                disabled={status !== 'idle'}
                            />
                            <Label
                                htmlFor={`simulate-before-execute-${instruction.name}`}
                                className="cursor-pointer text-xs text-white"
                            >
                                Simulate before executing
                            </Label>
                        </div>
                        {!simulateBeforeExecute && (
                            <div data-testid="simulate-skipped-warning">
                                <WarningNote
                                    className="mt-3"
                                    label="Instruction simulation is skipped during execution"
                                />
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Card>
    );
}

function AccountController({
    account,
    name,
    control,
    rules,
    getAutocompleteItems,
    seeds,
}: {
    account: InstructionAccountData;
    name: FieldPath<InstructionFormData>;
    control: Control<InstructionFormData>;
    rules: { required: { value: boolean; message: string } };
    getAutocompleteItems: (accountName: string) => AutocompleteItem[];
    seeds: { name: string }[];
}) {
    const autocompleteItems = getAutocompleteItems(account.name);
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <AccountInput
                    {...field}
                    value={typeof field.value === 'string' ? field.value : ''}
                    account={account}
                    error={error}
                    autocompleteItems={autocompleteItems}
                    seeds={seeds}
                />
            )}
        />
    );
}

function NestedAccountGroup({
    group,
    control,
    fieldNames,
    validationRules,
    getAutocompleteItems,
    seeds,
}: {
    group: NestedInstructionAccountsData;
    control: Control<InstructionFormData>;
    fieldNames: ReturnType<typeof useInstructionForm>['fieldNames'];
    validationRules: ReturnType<typeof useInstructionForm>['validationRules'];
    getAutocompleteItems: (accountName: string) => AutocompleteItem[];
    seeds: { name: string }[];
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-400">{group.name}</h4>
            <div className="ml-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                {group.accounts.map(nestedAccount => (
                    <AccountController
                        key={nestedAccount.name}
                        account={nestedAccount}
                        name={fieldNames.account(group, nestedAccount)}
                        control={control}
                        rules={validationRules.account(nestedAccount)}
                        getAutocompleteItems={getAutocompleteItems}
                        seeds={seeds}
                    />
                ))}
            </div>
        </div>
    );
}

function ActionButton({
    onClick,
    disabled,
    loading,
    icon,
    label,
    variant,
    tooltipText,
}: {
    onClick: () => void;
    disabled: boolean;
    loading: boolean;
    icon: ReactNode;
    label: string;
    variant: ButtonProps['variant'];
    tooltipText?: string;
}) {
    const button = (
        <Button variant={variant} size="sm" onClick={onClick} disabled={disabled}>
            {loading ? <Loader size={16} className="animate-spin" /> : icon}
            {label}
        </Button>
    );

    if (!tooltipText) {
        return button;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-fit">{button}</div>
            </TooltipTrigger>
            <TooltipContent>
                <div className="min-w-36 max-w-16">{tooltipText}</div>
            </TooltipContent>
        </Tooltip>
    );
}
