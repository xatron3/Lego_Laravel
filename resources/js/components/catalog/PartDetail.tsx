import { useState } from "react";
import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogPart, CatalogPartColor, CatalogPartSet } from "../../api";
import BricklinkButton from "./BricklinkButton";
import StatCard from "./StatCard";
import { catalogSetUrl } from "../../utils/seoUrls";

interface PartDetailProps {
    part: CatalogPart;
}

/**
 * Detail view for a LEGO part with color variants and sets containing it
 */
export default function PartDetail({ part }: PartDetailProps) {
    const [selectedColor, setSelectedColor] = useState<CatalogPartColor | null>(
        part.available_colors?.[0] || null,
    );

    const selectedImageUrl = selectedColor?.image_url || part.image_url;
    const selectedPhotoUrl = selectedColor?.photo_url || part.photo_url;
    const { imageUrl, handleError } = useImageFallback(
        selectedImageUrl,
        selectedPhotoUrl,
    );

    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Image */}
                    <div className="lg:w-1/3">
                        <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={part.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={handleError}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-6xl">🧱</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {part.name}
                                </h1>
                                <p className="text-yellow-400 font-mono text-lg">
                                    {part.part_num}
                                </p>
                            </div>
                            <BricklinkButton url={part.bricklink_url} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            <StatCard
                                label="Category"
                                value={part.category?.name || "Unknown"}
                                icon="📁"
                            />
                            <StatCard
                                label="Colors"
                                value={(
                                    part.available_colors?.length || 0
                                ).toString()}
                                icon="🎨"
                            />
                            <StatCard
                                label="In Sets"
                                value={(
                                    part.in_sets_count || 0
                                ).toLocaleString()}
                                icon="🏗️"
                            />
                        </div>

                        {/* Color Picker */}
                        {part.available_colors &&
                            part.available_colors.length > 0 && (
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <div className="text-gray-400 text-sm mb-3">
                                        Available Colors
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {part.available_colors.map((color) => (
                                            <button
                                                key={color.id}
                                                onClick={() =>
                                                    setSelectedColor(color)
                                                }
                                                className={`group relative w-10 h-10 rounded-lg border-2 transition-all ${
                                                    selectedColor?.id ===
                                                    color.id
                                                        ? "border-yellow-400 scale-110"
                                                        : "border-gray-600 hover:border-gray-400"
                                                }`}
                                                title={color.name}
                                            >
                                                <div
                                                    className="w-full h-full rounded-md"
                                                    style={{
                                                        backgroundColor: `#${color.rgb}`,
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {selectedColor && (
                                        <div className="mt-3 text-white">
                                            {selectedColor.name}
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Sets containing this part */}
            {part.in_sets && part.in_sets.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Found in {part.in_sets_count?.toLocaleString()} Sets
                        {part.in_sets_count && part.in_sets_count > 50 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing top 50)
                            </span>
                        )}
                    </h2>
                    <SetsGrid sets={part.in_sets} />
                </div>
            )}
        </div>
    );
}

interface SetsGridProps {
    sets: CatalogPartSet[];
}

function SetsGrid({ sets }: SetsGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sets.map((s) => (
                <SetCard key={s.set_num} set={s} />
            ))}
        </div>
    );
}

interface SetCardProps {
    set: CatalogPartSet;
}

function SetCard({ set }: SetCardProps) {
    const { imageUrl, handleError } = useImageFallback(set.image_url);

    return (
        <a
            href={catalogSetUrl(set)}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={set.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        onError={handleError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🏗️</span>
                    </div>
                )}
                {set.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-sm font-bold">
                        {set.quantity}×
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="text-yellow-400 text-xs font-mono mb-1">
                    {set.set_num}
                </div>
                <div className="text-white text-sm truncate" title={set.name}>
                    {set.name}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{set.year}</span>
                    <span>{set.num_parts} pcs</span>
                </div>
            </div>
        </a>
    );
}
