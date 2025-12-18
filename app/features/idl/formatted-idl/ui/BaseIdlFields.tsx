import type { FieldType, StructField } from '@entities/idl';
import { Badge } from '@shared/ui/badge';

import { IdlDocTooltip } from './BaseIdlDoc';
import { HighlightNode } from './HighlightNode';

export function BaseIdlFields({ fieldType }: { fieldType?: FieldType | null }) {
    if (!fieldType) return null;

    switch (fieldType.kind) {
        case 'struct':
            return <BaseIdlStructFields fields={fieldType.fields} />;
        case 'enum':
            return <BaseIdlEnumFields variants={fieldType.variants} />;
        case 'type':
        case 'unknown':
            return <BaseIdlTypeField docs={fieldType.docs} name={fieldType.name} type={fieldType.type} />;
        default:
            return <></>;
    }
}

export function BaseIdlStructFields({ fields }: { fields?: StructField[] }) {
    if (!fields) return null;

    return (
        <div className="e-flex e-flex-col e-flex-wrap e-items-start e-justify-start e-gap-2">
            {fields.map((field, index) => (
                <IdlDocTooltip key={index} docs={field.docs}>
                    <div className="e-inline-flex e-items-center e-gap-2">
                        <HighlightNode className="e-rounded e-font-mono e-text-xs">
                            {field.name && <span>{field.name}:</span>}
                            <Badge variant="success" size="xs">
                                {field.type}
                            </Badge>
                        </HighlightNode>
                    </div>
                </IdlDocTooltip>
            ))}
        </div>
    );
}

export function BaseIdlEnumFields({ variants }: { variants?: string[] }) {
    if (!variants?.length) return null;

    return (
        <div className="e-flex e-flex-col e-flex-wrap e-items-start e-gap-2">
            {variants.map((variant, index) => (
                <HighlightNode key={index} className="e-rounded">
                    <Badge variant="info" size="xs" className="e-break-all">
                        {variant}
                    </Badge>
                </HighlightNode>
            ))}
        </div>
    );
}

export function BaseIdlTypeField({ docs, name, type }: { docs?: string[]; name?: string; type: string }) {
    return (
        <IdlDocTooltip docs={docs}>
            <div className="e-w-fit">
                <HighlightNode className="e-inline-flex e-rounded">
                    <div className="e-inline-flex e-items-center e-gap-2">
                        {name && <span className="e-font-mono e-text-xs">{name}:</span>}
                        <Badge variant="success" size="xs">
                            {type}
                        </Badge>
                    </div>
                </HighlightNode>
            </div>
        </IdlDocTooltip>
    );
}
