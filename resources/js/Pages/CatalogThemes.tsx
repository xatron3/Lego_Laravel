import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import LoadingGrid from "../components/catalog/LoadingGrid";
import EmptyState from "../components/catalog/EmptyState";
import { api } from "../api";
import { catalogThemeUrl } from "../utils/seoUrls";

interface CatalogThemesProps {
    stats?: {
        sets?: number;
        mocs?: number;
        parts?: number;
        minifigs?: number;
        themes?: number;
    };
}

/**
 * Themes listing page with search and hierarchical display.
 */
export default function CatalogThemes({ stats }: CatalogThemesProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [themes, setThemes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [hierarchical, setHierarchical] = useState(true);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data
    useEffect(() => {
        setIsLoading(true);
        api.getCatalogThemes({
            search: debouncedSearch || undefined,
            hierarchical,
        })
            .then((data) => {
                setThemes(data);
            })
            .catch((err) => console.error("Failed to load themes:", err))
            .finally(() => setIsLoading(false));
    }, [debouncedSearch, hierarchical]);

    const activeFilterCount =
        (debouncedSearch ? 1 : 0) + (hierarchical ? 0 : 1);

    const handleClearFilters = () => {
        setSearch("");
        setHierarchical(true);
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                currentPage="catalog"
                onOpenAuthModal={() => setShowAuthModal(true)}
            />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Themes
                    </h1>
                    <p className="text-gray-400">
                        Browse LEGO themes and categories
                    </p>
                </div>

                <CatalogNav active="themes" stats={stats} />

                {/* Search + Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <SearchAutocomplete
                            scope="themes"
                            placeholder="Search themes..."
                            value={search}
                            onChange={setSearch}
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:border-yellow-500 transition-colors">
                            <input
                                type="checkbox"
                                checked={hierarchical}
                                onChange={(e) =>
                                    setHierarchical(e.target.checked)
                                }
                                className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-300">
                                Hierarchical View
                            </span>
                        </label>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:border-red-500 hover:text-red-400 transition-colors"
                            >
                                Clear Filters ({activeFilterCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <LoadingGrid count={8} />
                ) : themes.length === 0 ? (
                    <EmptyState message="No themes found" />
                ) : (
                    <>
                        {hierarchical ? (
                            <div className="space-y-6">
                                {themes.map((theme) => (
                                    <ThemeHierarchyCard
                                        key={theme.id}
                                        theme={theme}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {themes.map((theme) => (
                                    <ThemeCard key={theme.id} theme={theme} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

// ==================== Sub-components ====================

/**
 * Hierarchical theme card showing theme with children.
 */
function ThemeHierarchyCard({ theme }: { theme: any }) {
    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            {/* Parent Theme */}
            <a
                href={catalogThemeUrl(theme)}
                className="flex items-center gap-4 mb-4 group"
            >
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                        {theme.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {theme.sets_count?.toLocaleString() ?? 0} sets
                    </p>
                </div>
                <svg
                    className="w-5 h-5 text-gray-500 group-hover:text-yellow-400 transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </a>

            {/* Child Themes */}
            {theme.children && theme.children.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-700">
                    {theme.children
                        .filter((child: any) => (child.sets_count ?? 0) > 0)
                        .map((child: any) => (
                            <a
                                key={child.id}
                                href={catalogThemeUrl(child)}
                                className="flex flex-col gap-1 p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-yellow-500 transition-all group"
                            >
                                <div className="text-sm font-medium text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                                    {child.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {child.sets_count?.toLocaleString() ?? 0}{" "}
                                    sets
                                </div>
                            </a>
                        ))}
                </div>
            )}
        </div>
    );
}

/**
 * Simple theme card for grid view.
 */
function ThemeCard({ theme }: { theme: any }) {
    return (
        <a
            href={catalogThemeUrl(theme)}
            className="flex flex-col gap-2 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500 transition-all group"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-white truncate group-hover:text-yellow-400 transition-colors">
                    {theme.name}
                </h3>
                <svg
                    className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </div>
            <div className="text-sm text-gray-400">
                {theme.sets_count?.toLocaleString() ?? 0} sets
            </div>
        </a>
    );
}
