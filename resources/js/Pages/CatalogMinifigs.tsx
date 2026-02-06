import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import ViewToggle from "../components/catalog/ViewToggle";
import FilterPanel, {
    SelectFilter,
    NumberFilter,
} from "../components/catalog/FilterPanel";
import MinifigCard from "../components/catalog/MinifigCard";
import MinifigTableRow from "../components/catalog/MinifigTableRow";
import LoadingGrid from "../components/catalog/LoadingGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import { usePagination } from "../hooks/usePagination";
import { api } from "../api";

/**
 * Minifigs listing page with filtering, search, and grid/table view.
 */
export default function CatalogMinifigs() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [minifigs, setMinifigs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [minParts, setMinParts] = useState("");
    const [sortBy, setSortBy] = useState("name-asc");

    const { page, setPage, pagination, setPagination } = usePagination([
        debouncedSearch,
        minParts,
        sortBy,
    ]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data
    useEffect(() => {
        setIsLoading(true);
        const [sort, direction] = sortBy.split("-");
        api.getCatalogMinifigs({
            search: debouncedSearch || undefined,
            min_parts: minParts ? Number(minParts) : undefined,
            sort,
            direction,
            page,
            per_page: view === "table" ? 100 : 48,
        })
            .then((result) => {
                setMinifigs(result.data);
                setPagination({
                    lastPage: result.last_page,
                    total: result.total,
                });
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [debouncedSearch, minParts, sortBy, page, view]);

    const activeFilterCount = [minParts].filter(Boolean).length;

    const clearFilters = () => {
        setMinParts("");
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
                        LEGO Minifigs
                    </h1>
                    <p className="text-gray-400">
                        Browse collectible minifigures across all themes
                    </p>
                </div>

                <CatalogNav active="minifigs" />

                {/* Search */}
                <SearchAutocomplete
                    scope="minifigs"
                    placeholder="Search minifigs by name or number..."
                    onSearch={setSearch}
                    className="mb-6 max-w-2xl"
                />

                {/* Filters */}
                <FilterPanel activeCount={activeFilterCount}>
                    <NumberFilter
                        label="Min Parts"
                        value={minParts}
                        onChange={setMinParts}
                        placeholder="0"
                        min={0}
                    />
                    <SelectFilter
                        label="Sort By"
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: "name-asc", label: "Name A-Z" },
                            { value: "name-desc", label: "Name Z-A" },
                            {
                                value: "num_parts-desc",
                                label: "Most Parts",
                            },
                            {
                                value: "num_parts-asc",
                                label: "Fewest Parts",
                            },
                            { value: "fig_num-asc", label: "Fig # Asc" },
                            { value: "fig_num-desc", label: "Fig # Desc" },
                        ]}
                    />
                    {activeFilterCount > 0 && (
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </FilterPanel>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400">
                        {isLoading
                            ? "Loading..."
                            : `Showing ${minifigs.length} of ${pagination.total?.toLocaleString() || 0} minifigs`}
                    </div>
                    <ViewToggle view={view} onViewChange={setView} />
                </div>

                {/* Results */}
                {isLoading ? (
                    <LoadingGrid count={48} />
                ) : minifigs.length > 0 ? (
                    view === "grid" ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {minifigs.map((fig) => (
                                <MinifigCard key={fig.fig_num} minifig={fig} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                            <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <div className="w-10" />
                                <div className="flex-1">Name</div>
                                <div className="w-20 text-right">Parts</div>
                            </div>
                            {minifigs.map((fig) => (
                                <MinifigTableRow
                                    key={fig.fig_num}
                                    minifig={fig}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState message="No minifigs found matching your criteria" />
                )}

                <Pagination
                    currentPage={page}
                    lastPage={pagination.lastPage}
                    onPageChange={setPage}
                />
            </main>

            <Footer />
        </div>
    );
}
