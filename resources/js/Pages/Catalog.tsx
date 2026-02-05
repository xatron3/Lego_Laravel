import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import { api } from "../api";
import { catalogThemeUrl } from "../utils/seoUrls";

// Import shared components
import SetCard from "../components/catalog/SetCard";
import PartCard from "../components/catalog/PartCard";
import MinifigCard from "../components/catalog/MinifigCard";
import ColorCard from "../components/catalog/ColorCard";
import LoadingGrid from "../components/catalog/LoadingGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import { usePagination } from "../hooks/usePagination";

type TabType = "sets" | "mocs" | "parts" | "minifigs" | "colors" | "themes";

interface CatalogStats {
    sets: number;
    mocs: number;
    parts: number;
    minifigs: number;
    colors: number;
    themes: number;
}

interface CatalogProps {
    initialStats?: CatalogStats;
}

/**
 * Catalog page component - browse LEGO sets, parts, minifigs, colors, and themes
 * Follows SRP by delegating tab content to specialized components
 */
export default function Catalog({ initialStats }: CatalogProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("sets");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [stats, setStats] = useState<CatalogStats>(
        initialStats || {
            sets: 0,
            mocs: 0,
            parts: 0,
            minifigs: 0,
            colors: 0,
            themes: 0,
        },
    );

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Only fetch stats if not provided via props
    useEffect(() => {
        if (!initialStats) {
            api.getCatalogStats().then(setStats).catch(console.error);
        }
    }, [initialStats]);

    const tabConfig = [
        {
            key: "sets" as TabType,
            label: "Sets",
            count: stats.sets,
            icon: "📦",
        },
        {
            key: "mocs" as TabType,
            label: "MOCs",
            count: stats.mocs,
            icon: "🔨",
        },
        {
            key: "parts" as TabType,
            label: "Parts",
            count: stats.parts,
            icon: "🧱",
        },
        {
            key: "minifigs" as TabType,
            label: "Minifigs",
            count: stats.minifigs,
            icon: "🧑",
        },
        {
            key: "colors" as TabType,
            label: "Colors",
            count: stats.colors,
            icon: "🎨",
        },
        {
            key: "themes" as TabType,
            label: "Themes",
            count: stats.themes,
            icon: "🏷️",
        },
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        LEGO Catalog
                    </h1>
                    <p className="text-gray-400">
                        Browse through {stats.sets?.toLocaleString() || 0} sets,{" "}
                        {stats.mocs?.toLocaleString() || 0} MOCs,{" "}
                        {stats.parts?.toLocaleString() || 0} parts, and{" "}
                        {stats.minifigs?.toLocaleString() || 0} minifigs
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
                    {tabConfig.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className="text-sm opacity-75">
                                ({tab.count?.toLocaleString() || 0})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <svg
                            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "sets" && <SetsTab search={debouncedSearch} />}
                {activeTab === "mocs" && <MocsTab search={debouncedSearch} />}
                {activeTab === "parts" && <PartsTab search={debouncedSearch} />}
                {activeTab === "minifigs" && (
                    <MinifigsTab search={debouncedSearch} />
                )}
                {activeTab === "colors" && (
                    <ColorsTab search={debouncedSearch} />
                )}
                {activeTab === "themes" && (
                    <ThemesTab search={debouncedSearch} />
                )}
            </main>
        </div>
    );
}

// ==================== Tab Components ====================
// Simplified versions using shared components and hooks

function SetsTab({ search }: { search: string }) {
    const [sets, setSets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [themes, setThemes] = useState<any[]>([]);
    const [yearRange, setYearRange] = useState({ min: 1950, max: 2026 });
    const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
    const [yearFrom, setYearFrom] = useState<number | null>(null);
    const [yearTo, setYearTo] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState("year");
    const [sortDir, setSortDir] = useState("desc");
    const [imageLoadStatus, setImageLoadStatus] = useState<
        Record<string, boolean>
    >({});
    const { page, setPage, pagination, setPagination } = usePagination([
        search,
        selectedTheme,
        yearFrom,
        yearTo,
        sortBy,
        sortDir,
    ]);

    // Track image load success/failure
    const handleImageLoad = (setNum: string, loaded: boolean) => {
        setImageLoadStatus((prev) => ({ ...prev, [setNum]: loaded }));
    };

    // Sort sets with working images first
    const sortedSets = [...sets].sort((a, b) => {
        const aHasImage = imageLoadStatus[a.set_num] === true;
        const bHasImage = imageLoadStatus[b.set_num] === true;

        // Prioritize sets with images
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0; // Keep original order for sets with same image status
    });

    useEffect(() => {
        api.getCatalogThemes({ hierarchical: false })
            .then(setThemes)
            .catch(console.error);
        api.getCatalogYearRange().then(setYearRange).catch(console.error);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogSets({
            search: search || undefined,
            theme_id: selectedTheme || undefined,
            year_from: yearFrom || undefined,
            year_to: yearTo || undefined,
            sort: sortBy,
            direction: sortDir,
            page,
            per_page: 24,
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
    }, [search, selectedTheme, yearFrom, yearTo, sortBy, sortDir, page]);

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <select
                    value={selectedTheme || ""}
                    onChange={(e) =>
                        setSelectedTheme(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="">All Themes</option>
                    {themes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    value={yearFrom || ""}
                    onChange={(e) =>
                        setYearFrom(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    placeholder={`From (${yearRange.min})`}
                    className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <input
                    type="number"
                    value={yearTo || ""}
                    onChange={(e) =>
                        setYearTo(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    placeholder={`To (${yearRange.max})`}
                    className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <select
                    value={`${sortBy}-${sortDir}`}
                    onChange={(e) => {
                        const [s, d] = e.target.value.split("-");
                        setSortBy(s);
                        setSortDir(d);
                    }}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="year-desc">Newest First</option>
                    <option value="year-asc">Oldest First</option>
                    <option value="num_parts-desc">Most Pieces</option>
                    <option value="name-asc">Name A-Z</option>
                </select>
            </div>

            <div className="text-gray-400 mb-4">
                Showing {sets.length} of{" "}
                {pagination.total?.toLocaleString() || 0} sets
            </div>

            {isLoading ? (
                <LoadingGrid count={24} />
            ) : sets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sortedSets.map((set) => (
                        <SetCard
                            key={set.set_num}
                            set={set}
                            onImageLoad={handleImageLoad}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState message="No sets found matching your criteria" />
            )}

            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

function MocsTab({ search }: { search: string }) {
    const [mocs, setMocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [themes, setThemes] = useState<any[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState("year");
    const [sortDir, setSortDir] = useState("desc");
    const [imageLoadStatus, setImageLoadStatus] = useState<
        Record<string, boolean>
    >({});
    const { page, setPage, pagination, setPagination } = usePagination([
        search,
        selectedTheme,
        year,
        sortBy,
        sortDir,
    ]);

    // Track image load success/failure
    const handleImageLoad = (setNum: string, loaded: boolean) => {
        setImageLoadStatus((prev) => ({ ...prev, [setNum]: loaded }));
    };

    // Sort MOCs with working images first
    const sortedMocs = [...mocs].sort((a, b) => {
        const aHasImage = imageLoadStatus[a.set_num] === true;
        const bHasImage = imageLoadStatus[b.set_num] === true;

        // Prioritize MOCs with images
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0; // Keep original order for MOCs with same image status
    });

    useEffect(() => {
        api.getCatalogThemes({ hierarchical: false })
            .then(setThemes)
            .catch(console.error);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogMocs({
            search: search || undefined,
            theme_id: selectedTheme || undefined,
            year: year || undefined,
            sort: sortBy,
            direction: sortDir,
            page,
            per_page: 24,
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
    }, [search, selectedTheme, year, sortBy, sortDir, page]);

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <select
                    value={selectedTheme || ""}
                    onChange={(e) =>
                        setSelectedTheme(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="flex-1 min-w-50 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="">All Themes</option>
                    {themes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    value={year || ""}
                    onChange={(e) =>
                        setYear(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="Year"
                    className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <select
                    value={`${sortBy}-${sortDir}`}
                    onChange={(e) => {
                        const [s, d] = e.target.value.split("-");
                        setSortBy(s);
                        setSortDir(d);
                    }}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="year-desc">Newest First</option>
                    <option value="year-asc">Oldest First</option>
                    <option value="num_parts-desc">Most Pieces</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name A-Z</option>
                </select>
            </div>

            <div className="text-gray-400 mb-4">
                Showing {mocs.length} of{" "}
                {pagination.total?.toLocaleString() || 0} MOCs
            </div>

            {isLoading ? (
                <LoadingGrid count={24} />
            ) : mocs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sortedMocs.map((moc) => (
                        <SetCard
                            key={moc.set_num}
                            set={moc}
                            onImageLoad={handleImageLoad}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState message="No MOCs found matching your criteria" />
            )}

            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

function PartsTab({ search }: { search: string }) {
    const [parts, setParts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [selectedColor, setSelectedColor] = useState<number>(0);
    const { page, setPage, pagination, setPagination } = usePagination([
        search,
        selectedCategory,
        selectedColor,
    ]);

    useEffect(() => {
        api.getCatalogCategories().then(setCategories).catch(console.error);
        api.getCatalogColors().then(setColors).catch(console.error);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogParts({
            search: search || undefined,
            category_id: selectedCategory || undefined,
            color_id: selectedColor,
            page,
            per_page: 48,
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
    }, [search, selectedCategory, selectedColor, page]);

    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <select
                    value={selectedCategory || ""}
                    onChange={(e) =>
                        setSelectedCategory(
                            e.target.value ? Number(e.target.value) : null,
                        )
                    }
                    className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(Number(e.target.value))}
                    className="min-w-[200px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="0">All Colors</option>
                    {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="text-gray-400 mb-4">
                Showing {parts.length} of{" "}
                {pagination.total?.toLocaleString() || 0} parts
            </div>

            {isLoading ? (
                <LoadingGrid count={48} />
            ) : parts.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {parts.map((part) => (
                        <PartCard key={part.part_num} part={part} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No parts found matching your criteria" />
            )}

            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

function MinifigsTab({ search }: { search: string }) {
    const [minifigs, setMinifigs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const { page, setPage, pagination, setPagination } = usePagination([
        search,
        sortBy,
        sortDir,
    ]);

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogMinifigs({
            search: search || undefined,
            sort: sortBy,
            direction: sortDir,
            page,
            per_page: 48,
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
    }, [search, sortBy, sortDir, page]);

    return (
        <div>
            <div className="flex gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <select
                    value={`${sortBy}-${sortDir}`}
                    onChange={(e) => {
                        const [s, d] = e.target.value.split("-");
                        setSortBy(s);
                        setSortDir(d);
                    }}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="num_parts-desc">Most Parts</option>
                </select>
            </div>

            <div className="text-gray-400 mb-4">
                Showing {minifigs.length} of{" "}
                {pagination.total?.toLocaleString() || 0} minifigs
            </div>

            {isLoading ? (
                <LoadingGrid count={48} />
            ) : minifigs.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {minifigs.map((fig) => (
                        <MinifigCard key={fig.fig_num} minifig={fig} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No minifigs found matching your criteria" />
            )}

            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

function ColorsTab({ search }: { search: string }) {
    const [colors, setColors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTrans, setShowTrans] = useState<boolean | null>(null);

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogColors({
            search: search || undefined,
            is_trans: showTrans ?? undefined,
        })
            .then(setColors)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [search, showTrans]);

    return (
        <div>
            <div className="flex gap-2 mb-6 p-4 bg-gray-800 rounded-xl">
                <button
                    onClick={() => setShowTrans(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        showTrans === null
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-700 text-gray-300"
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setShowTrans(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        showTrans === false
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-700 text-gray-300"
                    }`}
                >
                    Solid
                </button>
                <button
                    onClick={() => setShowTrans(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        showTrans === true
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-700 text-gray-300"
                    }`}
                >
                    Transparent
                </button>
            </div>

            <div className="text-gray-400 mb-4">
                Showing {colors.length} colors
            </div>

            {isLoading ? (
                <LoadingGrid count={48} />
            ) : colors.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {colors.map((color) => (
                        <ColorCard key={color.id} color={color} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No colors found matching your criteria" />
            )}
        </div>
    );
}

function ThemesTab({ search }: { search: string }) {
    const [themes, setThemes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedThemes, setExpandedThemes] = useState<Set<number>>(
        new Set(),
    );

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogThemes({
            search: search || undefined,
            hierarchical: !search,
        })
            .then(setThemes)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [search]);

    const toggleExpand = (id: number) => {
        setExpandedThemes((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const renderTheme = (theme: any, level = 0): JSX.Element => (
        <div key={theme.id}>
            <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
                style={{ marginLeft: level * 24 }}
            >
                {theme.children?.length > 0 ? (
                    <button
                        onClick={() => toggleExpand(theme.id)}
                        className="text-gray-400"
                    >
                        {expandedThemes.has(theme.id) ? "" : ""}
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <a href={catalogThemeUrl(theme)} className="flex-1 group">
                    <div className="text-white group-hover:text-yellow-400">
                        {theme.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                        {theme.sets_count || 0} sets
                    </div>
                </a>
            </div>
            {theme.children && expandedThemes.has(theme.id) && (
                <div>
                    {theme.children.map((child: any) =>
                        renderTheme(child, level + 1),
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div>
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
            ) : themes.length > 0 ? (
                <div className="bg-gray-800 rounded-xl p-4">
                    {themes.map((theme) => renderTheme(theme))}
                </div>
            ) : (
                <EmptyState message="No themes found matching your criteria" />
            )}
        </div>
    );
}
