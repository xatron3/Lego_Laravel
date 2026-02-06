import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogSet } from "../../api";
import { catalogSetUrl } from "../../utils/seoUrls";

interface SetTableRowProps {
    set: CatalogSet;
}

/**
 * Table row component for displaying a LEGO set in table view
 */
export default function SetTableRow({ set }: SetTableRowProps) {
    const isMoc =
        set.set_num.startsWith("MODEL-") || set.set_num.startsWith("MOC-");
    const mocSet = set as any;
    const primaryImage =
        isMoc && mocSet.thumbnail ? `${mocSet.thumbnail}` : set.image_url;
    const { imageUrl, handleError } = useImageFallback(primaryImage);

    return (
        <a
            href={catalogSetUrl(set)}
            className="flex items-center gap-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border-b border-gray-700/50 transition-colors group"
        >
            <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={set.name}
                        className={`w-full h-full ${isMoc && mocSet.thumbnail ? "object-cover" : "object-contain p-0.5"}`}
                        onError={handleError}
                        loading="lazy"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm text-white group-hover:text-yellow-400 truncate transition-colors">
                    {set.name}
                </div>
                <div className="text-xs text-gray-400">{set.set_num}</div>
            </div>
            <div className="hidden sm:block text-sm text-gray-300 w-16 text-right">
                {set.year}
            </div>
            <div className="text-sm text-gray-300 w-20 text-right">
                {set.num_parts?.toLocaleString()} pcs
            </div>
            {set.theme && (
                <div className="hidden md:block text-xs text-gray-400 w-28 truncate text-right">
                    {set.theme.name}
                </div>
            )}
        </a>
    );
}
