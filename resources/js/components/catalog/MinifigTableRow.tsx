import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogMinifig } from "../../api";
import { catalogMinifigUrl } from "../../utils/seoUrls";

interface MinifigTableRowProps {
    minifig: CatalogMinifig;
}

/**
 * Table row component for displaying a LEGO minifig in table view
 */
export default function MinifigTableRow({ minifig }: MinifigTableRowProps) {
    const { imageUrl, handleError } = useImageFallback(minifig.image_url);

    return (
        <a
            href={catalogMinifigUrl(minifig)}
            className="flex items-center gap-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border-b border-gray-700/50 transition-colors group"
        >
            <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={minifig.name}
                        className="w-full h-full object-contain p-0.5"
                        onError={handleError}
                        loading="lazy"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm text-white group-hover:text-yellow-400 truncate transition-colors">
                    {minifig.name}
                </div>
                <div className="text-xs text-gray-400">{minifig.fig_num}</div>
            </div>
            <div className="text-sm text-gray-300 w-20 text-right">
                {minifig.num_parts} parts
            </div>
        </a>
    );
}
