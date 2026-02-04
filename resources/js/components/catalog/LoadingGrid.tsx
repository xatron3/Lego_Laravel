interface LoadingGridProps {
    count: number;
}

/**
 * Loading skeleton grid for catalog items
 */
export default function LoadingGrid({ count }: LoadingGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-gray-800 rounded-xl overflow-hidden animate-pulse"
                >
                    <div className="aspect-square bg-gray-700" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
