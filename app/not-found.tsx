import { ErrorCard } from '@components/common/ErrorCard';

export default function NotFoundPage() {
    return (
        <div className="container mt-4">
            <ErrorCard text="Page not found" />
        </div>
    );
}
