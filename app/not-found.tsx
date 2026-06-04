import { ErrorCard } from '@components/common/ErrorCard';

export default function NotFoundPage() {
    return (
        <div className="container e-mt-6">
            <ErrorCard text="Page not found" />
        </div>
    );
}
