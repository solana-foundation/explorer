import { CopyableMonoText, StatusBar } from './StatusBar';

export function TxErrorStatus({
    message,
    date,
    link,
    label = 'Error',
}: {
    message: string | undefined;
    date: Date;
    link: string | undefined;
    label?: string;
}) {
    return (
        <StatusBar
            message={message ? <CopyableMonoText text={message} theme="destructive" /> : undefined}
            date={date}
            theme="destructive"
            badge={{ label, variant: 'destructive' }}
            link={link}
        />
    );
}
