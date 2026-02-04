import type { CatalogColor } from "../../api";
import { catalogColorUrl } from "../../utils/seoUrls";

interface ColorCardProps {
    color: CatalogColor;
}

/**
 * Card component for displaying a LEGO color in catalog grids
 */
export default function ColorCard({ color }: ColorCardProps) {
    return (
        <a
            href={catalogColorUrl(color)}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors block"
        >
            <div
                className="aspect-square relative"
                style={{ backgroundColor: `#${color.rgb}` }}
            >
                {color.is_trans && (
                    <div className="absolute inset-0 bg-linear-to-br from-white/30 to-transparent" />
                )}
            </div>
            <div className="p-2">
                <div className="text-white text-xs truncate" title={color.name}>
                    {color.name}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">#{color.rgb}</span>
                    {color.is_trans && (
                        <span className="text-blue-400">Trans</span>
                    )}
                </div>
            </div>
        </a>
    );
}
