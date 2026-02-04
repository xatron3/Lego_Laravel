import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogTheme, CatalogThemeSet } from "../../api";
import StatCard from "./StatCard";
import { catalogThemeUrl, catalogSetUrl } from "../../utils/seoUrls";

interface ThemeDetailProps {
    theme: CatalogTheme;
}

/**
 * Detail view for a LEGO theme
 */
export default function ThemeDetail({ theme }: ThemeDetailProps) {
    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {theme.name}
                        </h1>
                        {theme.parent_id && (
                            <p className="text-gray-400">
                                Parent Theme: {theme.parent_id}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label="Sets"
                        value={(theme.sets_count || 0).toLocaleString()}
                        icon="🏗️"
                    />
                    <StatCard
                        label="Subthemes"
                        value={(theme.children?.length || 0).toString()}
                        icon="📁"
                    />
                </div>
            </div>

            {/* Subthemes */}
            {theme.children && theme.children.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Subthemes
                    </h2>
                    <SubthemesGrid subthemes={theme.children} />
                </div>
            )}

            {/* Sets in this theme */}
            {theme.sets_list && theme.sets_list.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Sets ({theme.sets_count})
                        {theme.sets_count && theme.sets_count > 50 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing top 50)
                            </span>
                        )}
                    </h2>
                    <SetsGrid sets={theme.sets_list} />
                </div>
            )}
        </div>
    );
}

interface SubthemesGridProps {
    subthemes: CatalogTheme[];
}

function SubthemesGrid({ subthemes }: SubthemesGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {subthemes.map((child) => (
                <a
                    key={child.id}
                    href={catalogThemeUrl(child)}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500 transition-colors"
                >
                    <div className="text-white font-medium mb-1">
                        {child.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                        {child.sets_count || 0} sets
                    </div>
                </a>
            ))}
        </div>
    );
}

interface SetsGridProps {
    sets: CatalogThemeSet[];
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
    set: CatalogThemeSet;
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
