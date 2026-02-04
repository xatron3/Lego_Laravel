import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogMinifig, CatalogMinifigSet } from "../../api";
import BricklinkButton from "./BricklinkButton";
import StatCard from "./StatCard";
import { catalogSetUrl } from "../../utils/seoUrls";

interface MinifigDetailProps {
    minifig: CatalogMinifig;
}

/**
 * Detail view for a LEGO minifig
 */
export default function MinifigDetail({ minifig }: MinifigDetailProps) {
    const { imageUrl, handleError } = useImageFallback(minifig.image_url);

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
                                    alt={minifig.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={handleError}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-6xl">🧑</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {minifig.name}
                                </h1>
                                <p className="text-yellow-400 font-mono text-lg">
                                    {minifig.fig_num}
                                </p>
                            </div>
                            <BricklinkButton url={minifig.bricklink_url} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                label="Parts"
                                value={minifig.num_parts.toString()}
                                icon="🧱"
                            />
                            <StatCard
                                label="In Sets"
                                value={minifig.in_sets_count.toString()}
                                icon="🏗️"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sets containing this minifig */}
            {minifig.in_sets && minifig.in_sets.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Found in {minifig.in_sets_count} Sets
                    </h2>
                    <SetsGrid sets={minifig.in_sets} />
                </div>
            )}
        </div>
    );
}

interface SetsGridProps {
    sets: CatalogMinifigSet[];
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
    set: CatalogMinifigSet;
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
