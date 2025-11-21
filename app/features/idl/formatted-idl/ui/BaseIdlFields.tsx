import type { FieldType, StructField } from '@entities/idl';
import { Badge } from '@shared/ui/badge';

import { IdlDocTooltip } from './BaseIdlDoc';

export function BaseIdlFields({ fieldType }: { fieldType: FieldType }) {
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
                        {field.name && <span className="e-font-mono e-text-xs">{field.name}:</span>}
                        <Badge variant="success" size="xs">
                            {field.type}
                        </Badge>
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
                <Badge key={index} variant="info" size="xs" className="e-break-all">
                    {variant}
                </Badge>
            ))}
        </div>
    );
}

export function BaseIdlTypeField({ docs, name, type }: { docs?: string[]; name?: string; type: string }) {
    return (
        <IdlDocTooltip docs={docs}>
            <div className="e-inline-flex e-items-center e-gap-2">
                {name && <span className="e-font-mono e-text-xs">{name}:</span>}
                <Badge variant="success" size="xs">
                    {type}
                </Badge>
            </div>
        </IdlDocTooltip>
    );
}
