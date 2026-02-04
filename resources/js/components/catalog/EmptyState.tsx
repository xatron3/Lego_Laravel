interface EmptyStateProps {
    message: string;
}

/**
 * Empty state component for no results
 */
export default function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">{message}</p>
        </div>
    );
}
