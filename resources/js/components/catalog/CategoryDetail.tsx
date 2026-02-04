import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogCategory } from "../../api";
import StatCard from "./StatCard";
import { catalogPartUrl } from "../../utils/seoUrls";

interface CategoryDetailProps {
    category: CatalogCategory;
}

/**
 * Detail view for a LEGO part category
 */
export default function CategoryDetail({ category }: CategoryDetailProps) {
    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <h1 className="text-3xl font-bold text-white mb-4">
                    {category.name}
                </h1>
                <StatCard
                    label="Parts in Category"
                    value={(category.parts_count || 0).toLocaleString()}
                    icon="🧱"
                />
            </div>

            {/* Parts in this category */}
            {category.parts_list && category.parts_list.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Parts
                        {category.parts_count && category.parts_count > 100 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing top 100)
                            </span>
                        )}
                    </h2>
                    <PartsGrid parts={category.parts_list} />
                </div>
            )}
        </div>
    );
}

interface PartsGridProps {
    parts: Array<{
        part_num: string;
        name: string;
        image_url: string;
        photo_url?: string;
        bricklink_url?: string;
    }>;
}

function PartsGrid({ parts }: PartsGridProps) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {parts.map((p) => (
                <PartCard key={p.part_num} part={p} />
            ))}
        </div>
    );
}

interface PartCardProps {
    part: {
        part_num: string;
        name: string;
        image_url: string;
        photo_url?: string;
        bricklink_url?: string;
    };
}

function PartCard({ part }: PartCardProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.image_url,
        part.photo_url,
    );

    return (
        <a
            href={catalogPartUrl(part)}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={part.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                        onError={handleError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-2xl">🧱</span>
                    </div>
                )}
            </div>
            <div className="p-2">
                <div className="text-yellow-400 text-xs font-mono truncate">
                    {part.part_num}
                </div>
                <div
                    className="text-white text-xs truncate mt-0.5"
                    title={part.name}
                >
                    {part.name}
                </div>
            </div>
        </a>
    );
}
