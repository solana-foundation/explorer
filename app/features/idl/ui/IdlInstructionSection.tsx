import { Copy, XCircle } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';
import { Card, CardBody } from '@/app/shared/ui/Card';

interface IIdlInstructionSectionProps {
    title: string;
    description: string;
    commands: string[];
}

export function IdlInstructionSection({ title, description, commands }: IIdlInstructionSectionProps) {
    const [state, copy] = useCopyToClipboard();

    function handleCopy() {
        copy(commands.join('\n'));
    }

    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit" className="flex items-start justify-between space-x-2 px-3 py-2">
                <div>
                    <h5 className="mb-1 text-sm font-semibold">{title}</h5>
                    <p className="mb-3 text-xs text-gray-500">{description}</p>
                    <div>
                        {commands.map((command, index) => (
                            <div key={index} className="font-mono text-xs">
                                <pre className="whitespace-pre-wrap bg-transparent p-0 text-green-400">
                                    <span>&gt; </span>
                                    {command}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    ui="dashkit"
                    variant="white"
                    size="sm"
                    onClick={handleCopy}
                    type="button"
                    className="flex-shrink-0"
                    aria-label={state === 'copied' ? 'Copied' : state === 'errored' ? 'Copy failed' : 'Copy'}
                >
                    {state === 'copied' ? (
                        <span className="text-green-400">Copied</span>
                    ) : state === 'errored' ? (
                        <span className="text-red-400">
                            <XCircle size={16} /> Failed
                        </span>
                    ) : (
                        <>
                            <Copy size={16} /> Copy
                        </>
                    )}
                </Button>
            </CardBody>
        </Card>
    );
}
