import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import ViewToggle from "../components/catalog/ViewToggle";
import FilterPanel, {
    SelectFilter,
    NumberFilter,
    ChipFilter,
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
}

interface CatalogMocsProps {
    themes: ThemeOption[];
}

/**
 * MOCs listing page with filtering, search, and grid/table view.
 */
export default function CatalogMocs({ themes }: CatalogMocsProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [mocs, setMocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedTheme, setSelectedTheme] = useState("");
    const [year, setYear] = useState("");
    const [priceFilter, setPriceFilter] = useState("all");
    const [sortBy, setSortBy] = useState("year-desc");

    const { page, setPage, pagination, setPagination } = usePagination([
        debouncedSearch,
        selectedTheme,
        year,
        priceFilter,
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
        api.getCatalogMocs({
            search: debouncedSearch || undefined,
            theme_id: selectedTheme ? Number(selectedTheme) : undefined,
            year: year ? Number(year) : undefined,
            sort,
            direction,
            page,
            per_page: view === "table" ? 50 : 24,
        })
            .then((result) => {
                setMocs(result.data);
                setPagination({
                    lastPage: result.last_page,
                    total: result.total,
                });
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [debouncedSearch, selectedTheme, year, sortBy, page, view]);

    const activeFilterCount = [
        selectedTheme,
        year,
        priceFilter !== "all" ? priceFilter : "",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSelectedTheme("");
        setYear("");
        setPriceFilter("all");
    };

    const themeOptions = [
        { value: "", label: "All Themes" },
        ...themes.map((t) => ({
            value: String(t.id),
            label: t.name,
        })),
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
                        MOCs (My Own Creations)
                    </h1>
                    <p className="text-gray-400">
                        Custom LEGO builds from the community
                    </p>
                </div>

                <CatalogNav active="mocs" />

                {/* Search */}
                <SearchAutocomplete
                    scope="mocs"
                    placeholder="Search MOCs by name or number..."
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
                        label="Year"
                        value={year}
                        onChange={setYear}
                        placeholder="Any"
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">
                            Price
                        </label>
                        <ChipFilter
                            options={[
                                { value: "all", label: "All" },
                                { value: "free", label: "Free" },
                                { value: "paid", label: "Paid" },
                            ]}
                            selected={priceFilter}
                            onChange={setPriceFilter}
                        />
                    </div>
                    <SelectFilter
                        label="Sort By"
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: "year-desc", label: "Newest First" },
                            { value: "year-asc", label: "Oldest First" },
                            {
                                value: "num_parts-desc",
                                label: "Most Pieces",
                            },
                            { value: "name-asc", label: "Name A-Z" },
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
                            : `Showing ${mocs.length} of ${pagination.total?.toLocaleString() || 0} MOCs`}
                    </div>
                    <ViewToggle view={view} onViewChange={setView} />
                </div>

                {/* Results */}
                {isLoading ? (
                    <LoadingGrid count={24} />
                ) : mocs.length > 0 ? (
                    view === "grid" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {mocs.map((moc) => (
                                <SetCard key={moc.set_num} set={moc} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
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
                            {mocs.map((moc) => (
                                <SetTableRow key={moc.set_num} set={moc} />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState message="No MOCs found matching your criteria" />
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
