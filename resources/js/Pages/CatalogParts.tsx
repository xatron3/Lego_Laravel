import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import ViewToggle from "../components/catalog/ViewToggle";
import FilterPanel, { SelectFilter } from "../components/catalog/FilterPanel";
import PartCard from "../components/catalog/PartCard";
import PartTableRow from "../components/catalog/PartTableRow";
import LoadingGrid from "../components/catalog/LoadingGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import { usePagination } from "../hooks/usePagination";
import { api } from "../api";

interface CategoryOption {
    id: number;
    name: string;
    parts_count: number;
}

interface ColorOption {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
}

interface CatalogPartsProps {
    categories: CategoryOption[];
    colors: ColorOption[];
}

/**
 * Parts listing page with category/color filtering, search, and grid/table view.
 */
export default function CatalogParts({
    categories,
    colors,
}: CatalogPartsProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [parts, setParts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState("0");
    const [sortBy, setSortBy] = useState("name-asc");

    const { page, setPage, pagination, setPagination } = usePagination([
        debouncedSearch,
        selectedCategory,
        selectedColor,
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
        api.getCatalogParts({
            search: debouncedSearch || undefined,
            category_id: selectedCategory
                ? Number(selectedCategory)
                : undefined,
            color_id: Number(selectedColor),
            sort,
            direction,
            page,
            per_page: view === "table" ? 100 : 48,
        })
            .then((result) => {
                setParts(result.data);
                setPagination({
                    lastPage: result.last_page,
                    total: result.total,
                });
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [debouncedSearch, selectedCategory, selectedColor, sortBy, page, view]);

    const activeFilterCount = [
        selectedCategory,
        selectedColor !== "0" ? selectedColor : "",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSelectedCategory("");
        setSelectedColor("0");
    };

    const categoryOptions = [
        { value: "", label: "All Categories" },
        ...categories.map((c) => ({
            value: String(c.id),
            label: `${c.name} (${c.parts_count.toLocaleString()})`,
        })),
    ];

    const colorOptions = [
        { value: "0", label: "All Colors" },
        ...colors.map((c) => ({
            value: String(c.id),
            label: `${c.is_trans ? "Trans-" : ""}${c.name}`,
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
                        LEGO Parts
                    </h1>
                    <p className="text-gray-400">
                        Browse individual bricks, plates, tiles, and specialty
                        elements
                    </p>
                </div>

                <CatalogNav active="parts" />

                {/* Search */}
                <SearchAutocomplete
                    scope="parts"
                    placeholder="Search parts by name or number..."
                    onSearch={setSearch}
                    className="mb-6 max-w-2xl"
                />

                {/* Filters */}
                <FilterPanel activeCount={activeFilterCount}>
                    <SelectFilter
                        label="Category"
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={categoryOptions}
                        className="min-w-55"
                    />
                    <SelectFilter
                        label="Color"
                        value={selectedColor}
                        onChange={setSelectedColor}
                        options={colorOptions}
                        className="min-w-45"
                    />
                    <SelectFilter
                        label="Sort By"
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: "name-asc", label: "Name A-Z" },
                            { value: "name-desc", label: "Name Z-A" },
                            { value: "part_num-asc", label: "Part # Asc" },
                            { value: "part_num-desc", label: "Part # Desc" },
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

                {/* Color Preview */}
                {selectedColor !== "0" && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                            Showing color:
                        </span>
                        {(() => {
                            const color = colors.find(
                                (c) => String(c.id) === selectedColor,
                            );
                            if (!color) return null;
                            return (
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-5 h-5 rounded-md border border-gray-600"
                                        style={{
                                            backgroundColor: `#${color.rgb}`,
                                        }}
                                    />
                                    <span className="text-sm text-white">
                                        {color.name}
                                    </span>
                                </span>
                            );
                        })()}
                    </div>
                )}

                {/* Results Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400">
                        {isLoading
                            ? "Loading..."
                            : `Showing ${parts.length} of ${pagination.total?.toLocaleString() || 0} parts`}
                    </div>
                    <ViewToggle view={view} onViewChange={setView} />
                </div>

                {/* Results */}
                {isLoading ? (
                    <LoadingGrid count={48} />
                ) : parts.length > 0 ? (
                    view === "grid" ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {parts.map((part) => (
                                <PartCard key={part.part_num} part={part} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                            <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <div className="w-10" />
                                <div className="flex-1">Name</div>
                                <div className="hidden md:block w-32 text-right">
                                    Category
                                </div>
                            </div>
                            {parts.map((part) => (
                                <PartTableRow key={part.part_num} part={part} />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState message="No parts found matching your criteria" />
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
