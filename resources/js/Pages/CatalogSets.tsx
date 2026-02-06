import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import ViewToggle from "../components/catalog/ViewToggle";
import FilterPanel, {
    SelectFilter,
    NumberFilter,
} from "../components/catalog/FilterPanel";
import SetCard from "../components/catalog/SetCard";
import SetTableRow from "../components/catalog/SetTableRow";
import LoadingGrid from "../components/catalog/LoadingGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import { usePagination } from "../hooks/usePagination";
import { api } from "../api";

interface ThemeOption {
    id: number;
    name: string;
    sets_count: number;
    children?: { id: number; name: string }[];
}

interface CatalogSetsProps {
    themes: ThemeOption[];
    yearRange: { min: number; max: number };
}

/**
 * Sets listing page with advanced filtering, search autocomplete,
 * and grid/table view toggle.
 */
export default function CatalogSets({ themes, yearRange }: CatalogSetsProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [sets, setSets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedTheme, setSelectedTheme] = useState("");
    const [yearFrom, setYearFrom] = useState("");
    const [yearTo, setYearTo] = useState("");
    const [minParts, setMinParts] = useState("");
    const [sortBy, setSortBy] = useState("year-desc");

    const { page, setPage, pagination, setPagination } = usePagination([
        debouncedSearch,
        selectedTheme,
        yearFrom,
        yearTo,
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
        api.getCatalogSets({
            search: debouncedSearch || undefined,
            theme_id: selectedTheme ? Number(selectedTheme) : undefined,
            year_from: yearFrom ? Number(yearFrom) : undefined,
            year_to: yearTo ? Number(yearTo) : undefined,
            min_parts: minParts ? Number(minParts) : undefined,
            sort,
            direction,
            page,
            per_page: view === "table" ? 50 : 24,
        })
            .then((result) => {
                setSets(result.data);
                setPagination({
                    lastPage: result.last_page,
                    total: result.total,
                });
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [
        debouncedSearch,
        selectedTheme,
        yearFrom,
        yearTo,
        minParts,
        sortBy,
        page,
        view,
    ]);

    const activeFilterCount = [
        selectedTheme,
        yearFrom,
        yearTo,
        minParts,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSelectedTheme("");
        setYearFrom("");
        setYearTo("");
        setMinParts("");
    };

    // Build theme options with hierarchy
    const themeOptions = [
        { value: "", label: "All Themes" },
        ...themes.flatMap((t) => [
            { value: String(t.id), label: t.name },
            ...(t.children || []).map((c) => ({
                value: String(c.id),
                label: `  └ ${c.name}`,
            })),
        ]),
    ];

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
                        LEGO Sets
                    </h1>
                    <p className="text-gray-400">
                        Browse the complete collection of official LEGO sets
                    </p>
                </div>

                <CatalogNav active="sets" />

                {/* Search */}
                <SearchAutocomplete
                    scope="sets"
                    placeholder="Search sets by name or number..."
                    onSearch={setSearch}
                    className="mb-6 max-w-2xl"
                />

                {/* Filters */}
                <FilterPanel activeCount={activeFilterCount}>
                    <SelectFilter
                        label="Theme"
                        value={selectedTheme}
                        onChange={setSelectedTheme}
                        options={themeOptions}
                        className="min-w-50"
                    />
                    <NumberFilter
                        label="Year From"
                        value={yearFrom}
                        onChange={setYearFrom}
                        placeholder={String(yearRange.min)}
                        min={yearRange.min}
                        max={yearRange.max}
                    />
                    <NumberFilter
                        label="Year To"
                        value={yearTo}
                        onChange={setYearTo}
                        placeholder={String(yearRange.max)}
                        min={yearRange.min}
                        max={yearRange.max}
                    />
                    <NumberFilter
                        label="Min Pieces"
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
                            { value: "year-desc", label: "Newest First" },
                            { value: "year-asc", label: "Oldest First" },
                            { value: "num_parts-desc", label: "Most Pieces" },
                            { value: "num_parts-asc", label: "Fewest Pieces" },
                            { value: "name-asc", label: "Name A-Z" },
                            { value: "name-desc", label: "Name Z-A" },
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
                            : `Showing ${sets.length} of ${pagination.total?.toLocaleString() || 0} sets`}
                    </div>
                    <ViewToggle view={view} onViewChange={setView} />
                </div>

                {/* Results */}
                {isLoading ? (
                    <LoadingGrid count={24} />
                ) : sets.length > 0 ? (
                    view === "grid" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {sets.map((set) => (
                                <SetCard key={set.set_num} set={set} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                            {/* Table Header */}
                            <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <div className="w-12" />
                                <div className="flex-1">Name</div>
                                <div className="hidden sm:block w-16 text-right">
                                    Year
                                </div>
                                <div className="w-20 text-right">Pieces</div>
                                <div className="hidden md:block w-28 text-right">
                                    Theme
                                </div>
                            </div>
                            {sets.map((set) => (
                                <SetTableRow key={set.set_num} set={set} />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState message="No sets found matching your criteria" />
                )}

                <Pagination
                    currentPage={page}
                    lastPage={pagination.lastPage}
                    onPageChange={setPage}
                />
            </main>
        </div>
    );
}
