import React from 'react';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <div className="card">
            <div className="card-body text-center">
                <LoadingSpinner />
                {message || 'Loading'}
            </div>
        </div>
    );
}

export function LoadingSpinner() {
    return <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>;
}
