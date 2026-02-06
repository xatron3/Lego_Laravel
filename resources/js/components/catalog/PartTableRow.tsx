import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogPart } from "../../api";
import { catalogPartUrl } from "../../utils/seoUrls";

interface PartTableRowProps {
    part: CatalogPart;
}

/**
 * Table row component for displaying a LEGO part in table view
 */
export default function PartTableRow({ part }: PartTableRowProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.image_url,
        part.photo_url,
    );

    return (
        <a
            href={catalogPartUrl(part)}
            className="flex items-center gap-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border-b border-gray-700/50 transition-colors group"
        >
            <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={part.name}
                        className="w-full h-full object-contain p-0.5"
                        onError={handleError}
                        loading="lazy"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm text-white group-hover:text-yellow-400 truncate transition-colors">
                    {part.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                        {part.part_num}
                    </span>
                    {part.filtered_color && (
                        <>
                            <span className="text-gray-600">•</span>
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded border border-gray-600 shrink-0"
                                    style={{
                                        backgroundColor: `#${part.filtered_color.rgb}`,
                                    }}
                                />
                                <span className="text-xs text-gray-400">
                                    {part.filtered_color.name}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {part.category && (
                <div className="hidden md:block text-xs text-gray-400 w-32 truncate text-right">
                    {part.category.name}
                </div>
            )}
        </a>
    );
}
