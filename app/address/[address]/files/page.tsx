import MetaplexFilesPageClient from './page-client';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function MetaplexFilesPage(props: Props) {
    return <MetaplexFilesPageClient {...props} />;
}
