import { Button } from '@components/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/shared/ui/dialog';
import { Input } from '@components/shared/ui/input';
import { Label } from '@components/shared/ui/label';
import { useToast } from '@components/shared/ui/sonner/use-toast';
import { truncateAddress } from '@entities/address';
import {
    buildProgramName,
    CUSTOM_IDL_PRIVACY_NOTE,
    CUSTOM_IDL_SAVE_FAILED_MESSAGE,
    CUSTOM_IDL_STORAGE_UNAVAILABLE_MESSAGE,
    CustomIdlForm,
    type CustomIdlRecord,
    customIdlStoreAtom,
    getIdlBadgeLabel,
    removeCustomIdlAtom,
} from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { type Cluster } from '@utils/cluster';
import { getProgramName } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import { cva } from 'class-variance-authority';
import { useAtomValue, useSetAtom } from 'jotai';
import Link from 'next/link';
import { type ReactNode, useId, useState } from 'react';
import { ChevronLeft, Edit2, Plus, Save, Trash2, X } from 'react-feather';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { Drawer } from '@/app/shared/ui/drawer';

type CatalogProgram = { record: CustomIdlRecord; name: string };

type PickedDetail = { kind: 'new' } | { kind: 'program'; programAddress: string; isEditing: boolean };

type Detail = { kind: 'new' } | { kind: 'program'; program: CatalogProgram; isEditing: boolean };

type CatalogProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function CustomIdlCatalog({ open, onOpenChange }: CatalogProps) {
    const { isMd } = useBreakpoint();
    const store = useAtomValue(customIdlStoreAtom);
    const { cluster } = useCluster();
    const removeCustomIdl = useSetAtom(removeCustomIdlAtom);
    const toast = useToast();
    const [picked, setPicked] = useState<PickedDetail>();
    const [step, setStep] = useState<'list' | 'detail'>('list');
    const formId = useId();

    if (store.status !== 'ready') {
        const status = <p className="m-0 text-sm text-neutral-400">{STORE_STATUS_MESSAGES[store.status]}</p>;
        return isMd ? (
            <CatalogDialog open={open} onOpenChange={onOpenChange} detail={status} />
        ) : (
            <CatalogDrawer open={open} onOpenChange={onOpenChange} step="list" list={status} />
        );
    }

    const programs = listPrograms(store.records, cluster);
    const detail = resolveDetail(picked, programs);
    const openDetail = (next: PickedDetail) => {
        setPicked(next);
        setStep('detail');
    };
    const showProgram = (programAddress: string, isEditing: boolean) =>
        setPicked({ isEditing, kind: 'program', programAddress });
    const remove = async (programAddress: string) => {
        const result = await removeCustomIdl(programAddress);
        if (result.ok) setStep('list');
        else toast.custom({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' });
    };
    const { unreadable } = store;
    const removeUnreadable = async () => {
        for (const programAddress of unreadable) {
            const result = await removeCustomIdl(programAddress);
            if (!result.ok) {
                toast.custom({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' });
                return;
            }
        }
    };

    const Layout = isMd ? CatalogDialog : CatalogDrawer;
    return (
        <Layout
            open={open}
            onOpenChange={onOpenChange}
            step={step}
            list={
                <>
                    <ProgramList programs={programs} selected={isMd ? detail : undefined} onOpen={openDetail} />
                    {unreadable.length > 0 && (
                        <UnreadableNotice count={unreadable.length} onRemove={() => void removeUnreadable()} />
                    )}
                </>
            }
            detail={
                <DetailPanel
                    key={detail.kind === 'new' ? 'new' : detail.program.record.customIdl.programAddress}
                    detail={detail}
                    formId={formId}
                    onSaved={programAddress => showProgram(programAddress, false)}
                    onNavigate={() => onOpenChange(false)}
                />
            }
            actions={
                <DetailActions
                    detail={detail}
                    formId={formId}
                    isTile={!isMd}
                    onBack={() => setStep('list')}
                    onEdit={programAddress => showProgram(programAddress, true)}
                    onCancel={programAddress => showProgram(programAddress, false)}
                    onRemove={programAddress => void remove(programAddress)}
                />
            }
        />
    );
}

const STORE_STATUS_MESSAGES = {
    failed: 'The Explorer could not load the custom IDLs. Reload the page to try again.',
    loading: 'Loading the custom IDLs…',
    unavailable: CUSTOM_IDL_STORAGE_UNAVAILABLE_MESSAGE,
};

function listPrograms(records: ReadonlyMap<string, CustomIdlRecord>, cluster: Cluster): CatalogProgram[] {
    return [...records.values()]
        .map(record => ({
            name: buildProgramName([record.customIdl.idl]) ?? getProgramName(record.customIdl.programAddress, cluster),
            record,
        }))
        .sort(
            (a, b) =>
                a.name.localeCompare(b.name) ||
                a.record.customIdl.programAddress.localeCompare(b.record.customIdl.programAddress),
        );
}

// A removal, here or in another tab, leaves a stale pick, so the catalog shows the first program instead.
function resolveDetail(picked: PickedDetail | undefined, programs: CatalogProgram[]): Detail {
    if (picked?.kind === 'new') return picked;
    const program =
        programs.find(({ record }) => record.customIdl.programAddress === picked?.programAddress) ?? programs.at(0);
    if (!program) return { kind: 'new' };
    const isEditing = picked?.programAddress === program.record.customIdl.programAddress && picked.isEditing;
    return { isEditing, kind: 'program', program };
}

type LayoutProps = CatalogProps & {
    step?: 'list' | 'detail';
    list?: ReactNode;
    detail?: ReactNode;
    actions?: ReactNode;
};

// The dialog has a fixed height, so it does not resize when the store loads or a program opens.
function CatalogDialog({ open, onOpenChange, list, detail, actions }: LayoutProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={DIALOG_CONTENT}>
                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5">
                    <CatalogTitle />
                    {list}
                </div>
                <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto border-0 border-l border-solid border-neutral-700 p-5">
                    {detail}
                    <div className="mt-auto flex justify-end gap-2">{actions}</div>
                </section>
            </DialogContent>
        </Dialog>
    );
}

// The shared dialog sets its own width, gap and padding, and `cn` keeps both classes, so these overrides need `!`.
const DIALOG_CONTENT = 'h-[min(560px,calc(100dvh-2rem))] !max-w-3xl grid-cols-[220px_1fr] !gap-0 overflow-hidden !p-0';

// One drawer for both steps, so a step change swaps the content and does not replay the slide-in.
function CatalogDrawer({ open, onOpenChange, step, list, detail, actions }: LayoutProps) {
    const isDetail = step === 'detail' && detail !== undefined;
    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            className={drawerVariants({ isDetail })}
            header={
                isDetail ? undefined : (
                    <div className="px-5 pb-3 pt-2">
                        <CatalogTitle />
                    </div>
                )
            }
            footer={isDetail ? <Drawer.Footer>{actions}</Drawer.Footer> : undefined}
        >
            <div className="flex flex-col gap-4 p-5 pt-3">
                {isDetail ? (
                    <>
                        <div className="sr-only">
                            <CatalogTitle />
                        </div>
                        {detail}
                    </>
                ) : (
                    list
                )}
            </div>
        </Drawer>
    );
}

// The detail step has a fixed height, so a switch to editing does not resize the drawer.
const drawerVariants = cva('', { variants: { isDetail: { false: '', true: 'h-[85dvh]' } } });

function CatalogTitle() {
    return (
        <>
            <DialogTitle className="text-lg">Custom IDLs</DialogTitle>
            <DialogDescription className="sr-only">The IDLs that this browser keeps for programs.</DialogDescription>
        </>
    );
}

function ProgramList({
    programs,
    selected,
    onOpen,
}: {
    programs: CatalogProgram[];
    // The drawer opens a program on tap, so its list shows no selection.
    selected: Detail | undefined;
    onOpen: (detail: PickedDetail) => void;
}) {
    const selectedAddress = selected?.kind === 'program' ? selected.program.record.customIdl.programAddress : undefined;
    const state = (isSelected: boolean) => (selected === undefined ? 'none' : isSelected);
    return (
        <nav aria-label="Programs with a custom IDL" className="-mx-5 flex flex-col">
            <button
                type="button"
                aria-current={selected?.kind === 'new' ? 'true' : undefined}
                className={programItemVariants({ className: 'mb-3', selected: state(selected?.kind === 'new') })}
                onClick={() => onOpen({ kind: 'new' })}
            >
                <span className="text-sm">Add IDL</span>
            </button>
            {programs.map(({ record, name }) => (
                <button
                    key={record.customIdl.programAddress}
                    type="button"
                    aria-current={record.customIdl.programAddress === selectedAddress ? 'true' : undefined}
                    className={programItemVariants({
                        selected: state(record.customIdl.programAddress === selectedAddress),
                    })}
                    onClick={() =>
                        onOpen({ isEditing: false, kind: 'program', programAddress: record.customIdl.programAddress })
                    }
                >
                    <span className="max-w-full truncate text-sm">{name}</span>
                    <span className="font-mono text-xs text-neutral-400">
                        {truncateAddress(record.customIdl.programAddress)}
                    </span>
                </button>
            ))}
        </nav>
    );
}

function UnreadableNotice({ count, onRemove }: { count: number; onRemove: () => void }) {
    return (
        <div className="flex flex-col items-start gap-2">
            <p className="m-0 text-xs text-neutral-400">
                This browser keeps {count === 1 ? '1 IDL' : `${count} IDLs`} that the Explorer cannot read.
            </p>
            <Button size="sm" variant="outline" onClick={onRemove}>
                <Trash2 />
                Remove unreadable IDLs
            </Button>
        </div>
    );
}

const programItemVariants = cva(
    'flex w-full min-w-0 flex-col items-start gap-0.5 border-0 px-5 py-2 text-left transition-colors',
    {
        variants: {
            selected: {
                false: 'bg-transparent text-neutral-300 hover:text-white',
                none: 'bg-transparent text-white active:bg-neutral-700',
                true: 'bg-neutral-700 text-white',
            },
        },
    },
);

function DetailPanel({
    detail,
    formId,
    onSaved,
    onNavigate,
}: {
    detail: Detail;
    formId: string;
    onSaved: (programAddress: string) => void;
    onNavigate: () => void;
}) {
    if (detail.kind === 'new') return <NewIdlPanel formId={formId} onSaved={onSaved} />;
    return (
        <StoredIdlPanel
            program={detail.program}
            isEditing={detail.isEditing}
            formId={formId}
            onSaved={onSaved}
            onNavigate={onNavigate}
        />
    );
}

function NewIdlPanel({ formId, onSaved }: { formId: string; onSaved: (programAddress: string) => void }) {
    const [programAddress, setProgramAddress] = useState('');
    const addressInputId = useId();
    return (
        <>
            <div className="flex flex-col gap-1 pr-8">
                <span className="text-sm font-medium text-white">Add an IDL</span>
                <p className="m-0 text-sm text-neutral-400">{CUSTOM_IDL_PRIVACY_NOTE}</p>
            </div>
            <CustomIdlForm id={formId} programAddress={programAddress.trim() || undefined} onSaved={onSaved}>
                <div className="flex flex-col gap-2">
                    <Label htmlFor={addressInputId}>Program address</Label>
                    <Input
                        id={addressInputId}
                        variant="dark"
                        className="font-mono"
                        spellCheck={false}
                        value={programAddress}
                        onChange={event => setProgramAddress(event.target.value)}
                    />
                    <p className="m-0 text-xs text-neutral-400">Leave it empty when the IDL declares its program.</p>
                </div>
            </CustomIdlForm>
        </>
    );
}

function StoredIdlPanel({
    program: { record, name },
    isEditing,
    formId,
    onSaved,
    onNavigate,
}: {
    program: CatalogProgram;
    isEditing: boolean;
    formId: string;
    onSaved: (programAddress: string) => void;
    onNavigate: () => void;
}) {
    const idlPath = useClusterPath({ pathname: `/address/${record.customIdl.programAddress}/idl` });
    const jsonLabelId = useId();
    const json = JSON.stringify(record.customIdl.idl, undefined, 2);
    return (
        <>
            <div className="flex flex-col gap-1 pr-8">
                <span className="text-sm font-medium text-white">{name}</span>
                <Link href={idlPath} onClick={onNavigate} className="w-fit break-all font-mono text-xs">
                    {record.customIdl.programAddress}
                </Link>
            </div>
            {isEditing ? (
                <CustomIdlForm
                    id={formId}
                    programAddress={record.customIdl.programAddress}
                    initialText={json}
                    initialOrigin={record.origin}
                    onSaved={onSaved}
                />
            ) : (
                <div className="flex min-h-48 flex-1 flex-col gap-2">
                    <span id={jsonLabelId} className="text-sm text-neutral-200">
                        {getIdlBadgeLabel(record.customIdl.idl)}
                    </span>
                    <pre
                        aria-labelledby={jsonLabelId}
                        className="m-0 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded border border-solid border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-neutral-200 [overflow-wrap:anywhere] max-md:max-h-[50dvh]"
                    >
                        {json}
                    </pre>
                </div>
            )}
        </>
    );
}

function DetailActions({
    detail,
    formId,
    isTile,
    onBack,
    onEdit,
    onCancel,
    onRemove,
}: {
    detail: Detail;
    formId: string;
    isTile: boolean;
    onBack: () => void;
    onEdit: (programAddress: string) => void;
    onCancel: (programAddress: string) => void;
    onRemove: (programAddress: string) => void;
}) {
    const size = isTile ? 'tile' : 'sm';
    const className = actionVariants({ isTile });
    // Without a key, React reuses the clicked Edit button as the Save submit button.
    // The browser then submits the form on the same click.
    const back = isTile && (
        <Button key="back" size={size} variant="outline" className={className} onClick={onBack}>
            <ChevronLeft />
            Back
        </Button>
    );

    if (detail.kind === 'new') {
        return (
            <>
                {back}
                <Button key="add" type="submit" form={formId} size={size} variant="accent" className={className}>
                    <Plus />
                    Add
                </Button>
            </>
        );
    }

    const { programAddress } = detail.program.record.customIdl;
    if (detail.isEditing) {
        return (
            <>
                <Button
                    key="cancel"
                    size={size}
                    variant="outline"
                    className={className}
                    onClick={() => onCancel(programAddress)}
                >
                    <X />
                    Cancel
                </Button>
                <Button key="save" type="submit" form={formId} size={size} variant="accent" className={className}>
                    <Save />
                    Save
                </Button>
            </>
        );
    }

    return (
        <>
            {back}
            <Button
                key="edit"
                size={size}
                variant="outline"
                className={className}
                onClick={() => onEdit(programAddress)}
            >
                <Edit2 />
                Edit
            </Button>
            <Button
                key="remove"
                size={size}
                variant="destructive"
                className={className}
                onClick={() => onRemove(programAddress)}
            >
                <Trash2 />
                Remove
            </Button>
        </>
    );
}

const actionVariants = cva('', { variants: { isTile: { false: '', true: 'flex-1' } } });
