import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogPart } from "../../api";
import { catalogPartUrl } from "../../utils/seoUrls";

interface PartCardProps {
    part: CatalogPart;
}

/**
 * Card component for displaying a LEGO part in catalog grids
 */
export default function PartCard({ part }: PartCardProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.image_url,
        part.photo_url,
    );

    return (
        <a
            href={catalogPartUrl(part)}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={part.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                        onError={handleError}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🧱</span>
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
