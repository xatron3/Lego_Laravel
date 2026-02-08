import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogSet } from "../../api";
import { useEffect } from "react";
import { catalogSetUrl } from "../../utils/seoUrls";

interface SetCardProps {
    set: CatalogSet;
    onImageLoad?: (setNum: string, loaded: boolean) => void;
}

/**
 * Card component for displaying a LEGO set in catalog grids
 */
export default function SetCard({ set, onImageLoad }: SetCardProps) {
    // Check if this is a MOC (set_num starts with 'MODEL-')
    const isMoc = set.set_num.startsWith("MODEL-");
    const mocSet = set as any; // Type assertion for MOC fields

    const primaryImage =
        isMoc && mocSet.thumbnail ? `${mocSet.thumbnail}` : set.image_url;

    const { imageUrl, hasError, handleError } = useImageFallback(primaryImage);

    // Report image load status to parent
    useEffect(() => {
        if (onImageLoad) {
            onImageLoad(set.set_num, !hasError && !!imageUrl);
        }
    }, [hasError, imageUrl, set.set_num, onImageLoad]);

    return (
        <a
            href={catalogSetUrl(set)}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div
                className={`${isMoc && mocSet.thumbnail ? "aspect-5/4" : "aspect-square"} bg-gray-700 relative overflow-hidden`}
            >
                {!hasError && imageUrl && (
                    <img
                        src={imageUrl}
                        alt={set.name}
                        className={`w-full h-full ${
                            isMoc && mocSet.thumbnail
                                ? "object-cover"
                                : "object-contain p-2"
                        } group-hover:scale-105 transition-transform`}
                        onError={handleError}
                        loading="lazy"
                    />
                )}
                {hasError && (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🏗️</span>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                    <div className="text-yellow-400 text-xs font-mono">
                        {set.set_num}
                    </div>
                </div>
            </div>
            <div className="p-3">
                <h3
                    className="text-white text-sm font-medium truncate"
                    title={set.name}
                >
                    {set.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{set.year}</span>
                    <span>{set.num_parts} pcs</span>
                </div>
                {set.theme && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                        {set.theme.name}
                    </div>
                )}
            </div>
        </a>
    );
}
