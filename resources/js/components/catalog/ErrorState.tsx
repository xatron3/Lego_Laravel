interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

/**
 * Error state component with retry button
 */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-gray-400 text-lg mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}
