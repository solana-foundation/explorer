import { JsonViewer } from '@components/common/JsonViewer';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cva } from 'class-variance-authority';

import { Card } from '@/app/shared/ui/Card';
import { CopyButton } from '@/app/shared/ui/CopyButton';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

type BaseAttestationDataCardProps = { data: object } | { raw: string };

// Same padding as the rows of the Overview card above it.
const bodyVariants = cva(ROW_PADDING, {
    variants: {
        format: {
            json: '',
            raw: 'flex items-start gap-2 break-all font-mono text-sm leading-5',
        },
    },
});

// `raw` takes the base64 of attestation bytes that could not be decoded against their schema.
export function BaseAttestationDataCard(props: BaseAttestationDataCardProps) {
    return (
        // `className=""`: bare wrapper, the surface comes from the `Card` inside.
        <CollapsibleSection title="Attestation Service" className="">
            <Card variant="tight" className="rounded-lg border-outer-space-800 bg-outer-space-900">
                {'data' in props ? (
                    <div className={bodyVariants({ format: 'json' })}>
                        <JsonViewer version="v2" src={props.data} />
                    </div>
                ) : (
                    <div className={bodyVariants({ format: 'raw' })}>
                        <span className="min-w-0 flex-1 py-0.5">{props.raw || '(empty)'}</span>
                        {props.raw && <CopyButton value={props.raw} noun="base64" variant="quiet" size="icon-sm" />}
                    </div>
                )}
            </Card>
        </CollapsibleSection>
    );
}
