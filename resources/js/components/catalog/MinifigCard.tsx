import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogMinifig } from "../../api";
import { catalogMinifigUrl } from "../../utils/seoUrls";

interface MinifigCardProps {
    minifig: CatalogMinifig;
}

/**
 * Card component for displaying a LEGO minifig in catalog grids
 */
export default function MinifigCard({ minifig }: MinifigCardProps) {
    const { imageUrl, handleError } = useImageFallback(minifig.image_url);

    return (
        <a
            href={catalogMinifigUrl(minifig)}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={minifig.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                        onError={handleError}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🧑</span>
                    </div>
                )}
            </div>
            <div className="p-2">
                <div className="text-yellow-400 text-xs font-mono truncate">
                    {minifig.fig_num}
                </div>
                <div
                    className="text-white text-xs truncate mt-0.5"
                    title={minifig.name}
                >
                    {minifig.name}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                    {minifig.num_parts} parts
                </div>
            </div>
        </a>
    );
}
