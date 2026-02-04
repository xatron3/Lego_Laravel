/**
 * Loading indicator component
 */
export default function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
            <p className="text-gray-400">Loading...</p>
        </div>
    );
}
