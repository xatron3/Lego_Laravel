import { useState, useEffect } from "react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import {
    api,
    CatalogSet,
    CatalogPart,
    CatalogMinifig,
    CatalogColor,
    CatalogTheme,
    CatalogCategory,
} from "../api";

type TabType = "sets" | "parts" | "minifigs" | "colors" | "themes";

export default function Catalog() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("sets");

    // Stats
    const [stats, setStats] = useState({
        sets: 0,
        parts: 0,
        minifigs: 0,
        colors: 0,
        themes: 0,
    });

    // Common filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Load stats on mount
    useEffect(() => {
        api.getCatalogStats().then(setStats).catch(console.error);
    }, []);

    const tabConfig = [
        {
            key: "sets" as TabType,
            label: "Sets",
            count: stats.sets,
            icon: "🏗️",
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
            icon: "📁",
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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        LEGO Catalog
                    </h1>
                    <p className="text-gray-400">
                        Browse through {stats.sets.toLocaleString()} sets,{" "}
                        {stats.parts.toLocaleString()} parts, and{" "}
                        {stats.minifigs.toLocaleString()} minifigs
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
                    {tabConfig.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setSearch("");
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                    activeTab === tab.key
                                        ? "bg-yellow-600"
                                        : "bg-gray-700"
                                }`}
                            >
                                {tab.count.toLocaleString()}
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

// ==================== Sets Tab ====================
function SetsTab({ search }: { search: string }) {
    const [sets, setSets] = useState<CatalogSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ lastPage: 1, total: 0 });
    const [themes, setThemes] = useState<CatalogTheme[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
    const [yearRange, setYearRange] = useState({ min: 1950, max: 2026 });
    const [yearFrom, setYearFrom] = useState<number | null>(null);
    const [yearTo, setYearTo] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState("year");
    const [sortDir, setSortDir] = useState("desc");

    // Load themes and year range
    useEffect(() => {
        api.getCatalogThemes({ hierarchical: false })
            .then(setThemes)
            .catch(console.error);
        api.getCatalogYearRange().then(setYearRange).catch(console.error);
    }, []);

    // Load sets
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

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, selectedTheme, yearFrom, yearTo, sortBy, sortDir]);

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                {/* Theme Filter */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-gray-400 text-sm mb-1">
                        Theme
                    </label>
                    <select
                        value={selectedTheme || ""}
                        onChange={(e) =>
                            setSelectedTheme(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="">All Themes</option>
                        {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.name} ({theme.sets_count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Year Range */}
                <div className="flex gap-2 items-end">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">
                            From Year
                        </label>
                        <input
                            type="number"
                            value={yearFrom || ""}
                            onChange={(e) =>
                                setYearFrom(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            placeholder={yearRange.min.toString()}
                            min={yearRange.min}
                            max={yearRange.max}
                            className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">
                            To Year
                        </label>
                        <input
                            type="number"
                            value={yearTo || ""}
                            onChange={(e) =>
                                setYearTo(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            placeholder={yearRange.max.toString()}
                            min={yearRange.min}
                            max={yearRange.max}
                            className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>

                {/* Sort */}
                <div>
                    <label className="block text-gray-400 text-sm mb-1">
                        Sort By
                    </label>
                    <select
                        value={`${sortBy}-${sortDir}`}
                        onChange={(e) => {
                            const [field, dir] = e.target.value.split("-");
                            setSortBy(field);
                            setSortDir(dir);
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="year-desc">Newest First</option>
                        <option value="year-asc">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="num_parts-desc">Most Parts</option>
                        <option value="num_parts-asc">Fewest Parts</option>
                    </select>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-gray-400 mb-4">
                Showing {sets.length} of {pagination.total.toLocaleString()}{" "}
                sets
            </div>

            {/* Grid */}
            {isLoading ? (
                <LoadingGrid count={24} />
            ) : sets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {sets.map((set) => (
                        <SetCard key={set.set_num} set={set} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No sets found matching your criteria" />
            )}

            {/* Pagination */}
            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

// ==================== Parts Tab ====================
function PartsTab({ search }: { search: string }) {
    const [parts, setParts] = useState<CatalogPart[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ lastPage: 1, total: 0 });
    const [categories, setCategories] = useState<CatalogCategory[]>([]);
    const [colors, setColors] = useState<CatalogColor[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [selectedColor, setSelectedColor] = useState<number>(0);

    // Load categories and colors
    useEffect(() => {
        api.getCatalogCategories().then(setCategories).catch(console.error);
        api.getCatalogColors().then(setColors).catch(console.error);
    }, []);

    // Load parts
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

    useEffect(() => {
        setPage(1);
    }, [search, selectedCategory, selectedColor]);

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                {/* Category Filter */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-gray-400 text-sm mb-1">
                        Category
                    </label>
                    <select
                        value={selectedCategory || ""}
                        onChange={(e) =>
                            setSelectedCategory(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.parts_count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Color Filter */}
                <div className="min-w-[200px]">
                    <label className="block text-gray-400 text-sm mb-1">
                        Display Color
                    </label>
                    <select
                        value={selectedColor}
                        onChange={(e) =>
                            setSelectedColor(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        {colors.slice(0, 50).map((color) => (
                            <option key={color.id} value={color.id}>
                                {color.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-gray-400 mb-4">
                Showing {parts.length} of {pagination.total.toLocaleString()}{" "}
                parts
            </div>

            {/* Grid */}
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

            {/* Pagination */}
            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

// ==================== Minifigs Tab ====================
function MinifigsTab({ search }: { search: string }) {
    const [minifigs, setMinifigs] = useState<CatalogMinifig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ lastPage: 1, total: 0 });
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

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

    useEffect(() => {
        setPage(1);
    }, [search, sortBy, sortDir]);

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">
                        Sort By
                    </label>
                    <select
                        value={`${sortBy}-${sortDir}`}
                        onChange={(e) => {
                            const [field, dir] = e.target.value.split("-");
                            setSortBy(field);
                            setSortDir(dir);
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="num_parts-desc">Most Parts</option>
                        <option value="num_parts-asc">Fewest Parts</option>
                    </select>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-gray-400 mb-4">
                Showing {minifigs.length} of {pagination.total.toLocaleString()}{" "}
                minifigs
            </div>

            {/* Grid */}
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

            {/* Pagination */}
            <Pagination
                currentPage={page}
                lastPage={pagination.lastPage}
                onPageChange={setPage}
            />
        </div>
    );
}

// ==================== Colors Tab ====================
function ColorsTab({ search }: { search: string }) {
    const [colors, setColors] = useState<CatalogColor[]>([]);
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

    const filteredColors = colors;

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-xl">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTrans(null)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            showTrans === null
                                ? "bg-yellow-500 text-gray-900"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setShowTrans(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            showTrans === false
                                ? "bg-yellow-500 text-gray-900"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                        Solid
                    </button>
                    <button
                        onClick={() => setShowTrans(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            showTrans === true
                                ? "bg-yellow-500 text-gray-900"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                        Transparent
                    </button>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-gray-400 mb-4">
                Showing {filteredColors.length} colors
            </div>

            {/* Grid */}
            {isLoading ? (
                <LoadingGrid count={48} />
            ) : filteredColors.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {filteredColors.map((color) => (
                        <ColorCard key={color.id} color={color} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No colors found matching your criteria" />
            )}
        </div>
    );
}

// ==================== Themes Tab ====================
function ThemesTab({ search }: { search: string }) {
    const [themes, setThemes] = useState<CatalogTheme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedThemes, setExpandedThemes] = useState<Set<number>>(
        new Set(),
    );

    useEffect(() => {
        setIsLoading(true);
        api.getCatalogThemes({
            search: search || undefined,
            hierarchical: !search, // Flat when searching
        })
            .then(setThemes)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [search]);

    const toggleExpand = (id: number) => {
        setExpandedThemes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const renderTheme = (theme: CatalogTheme, level = 0) => (
        <div key={theme.id}>
            <div
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                    level > 0 ? "ml-" + Math.min(level * 6, 24) : ""
                }`}
                style={{ marginLeft: level * 24 }}
            >
                {theme.children && theme.children.length > 0 ? (
                    <button
                        onClick={() => toggleExpand(theme.id)}
                        className="text-gray-400 w-5 hover:text-white"
                    >
                        {expandedThemes.has(theme.id) ? "▼" : "▶"}
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <a href={`/catalog/theme/${theme.id}`} className="flex-1 group">
                    <span className="text-white font-medium group-hover:text-yellow-400 transition-colors">
                        {theme.name}
                    </span>
                    {theme.sets_count !== undefined && (
                        <span className="text-gray-400 text-sm ml-2">
                            ({theme.sets_count} sets)
                        </span>
                    )}
                </a>
            </div>
            {theme.children && expandedThemes.has(theme.id) && (
                <div>
                    {theme.children.map((child) =>
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

// ==================== Card Components ====================

function SetCard({ set }: { set: CatalogSet }) {
    const [imgError, setImgError] = useState(false);

    // Check if this is a MOC (set_num starts with 'MODEL-')
    const isMoc = set.set_num.startsWith("MODEL-");
    const mocSet = set as any; // Type assertion for MOC fields

    return (
        <a
            href={`/catalog/set/${set.set_num}`}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {!imgError &&
                    (isMoc && mocSet.thumbnail ? (
                        <img
                            src={`/storage/${mocSet.thumbnail}`}
                            alt={set.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={() => setImgError(true)}
                            loading="lazy"
                        />
                    ) : !isMoc ? (
                        <img
                            src={set.image_url}
                            alt={set.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            onError={() => setImgError(true)}
                            loading="lazy"
                        />
                    ) : null)}
                {(imgError || (isMoc && !mocSet.thumbnail)) && (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">{isMoc ? "🏗️" : "🏗️"}</span>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-yellow-400 text-xs font-mono">
                        {set.set_num}
                    </div>
                    {isMoc && (
                        <div className="text-green-400 text-xs font-bold">
                            MOC
                        </div>
                    )}
                </div>
            </div>
            <div className="p-3">
                <h3
                    className="text-white text-sm font-medium truncate"
                    title={set.name}
                >
                    {set.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{set.year}</span>
                    <span>{set.num_parts} pcs</span>
                </div>
                {set.theme && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                        {set.theme.name}
                    </div>
                )}
            </div>
        </a>
    );
}

function PartCard({ part }: { part: CatalogPart }) {
    const [imgError, setImgError] = useState(false);
    const [photoError, setPhotoError] = useState(false);

    // Determine which image to show
    const imageUrl = !imgError
        ? part.image_url
        : !photoError && part.photo_url
          ? part.photo_url
          : null;

    return (
        <a
            href={`/catalog/part/${part.part_num}`}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={part.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                        onError={() => {
                            if (!imgError) {
                                setImgError(true);
                            } else {
                                setPhotoError(true);
                            }
                        }}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-2xl">🧱</span>
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

function MinifigCard({ minifig }: { minifig: CatalogMinifig }) {
    const [imgError, setImgError] = useState(false);

    return (
        <a
            href={`/catalog/minifig/${minifig.fig_num}`}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {!imgError ? (
                    <img
                        src={minifig.image_url}
                        alt={minifig.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                        onError={() => setImgError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-2xl">🧑</span>
                    </div>
                )}
            </div>
            <div className="p-2">
                <div className="text-yellow-400 text-xs font-mono truncate">
                    {minifig.fig_num}
                </div>
                <div
                    className="text-white text-xs truncate mt-0.5"
                    title={minifig.name}
                >
                    {minifig.name}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                    {minifig.num_parts} parts
                </div>
            </div>
        </a>
    );
}

function ColorCard({ color }: { color: CatalogColor }) {
    return (
        <a
            href={`/catalog/color/${color.id}`}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors block"
        >
            <div
                className="aspect-square relative"
                style={{ backgroundColor: `#${color.rgb}` }}
            >
                {color.is_trans && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                )}
            </div>
            <div className="p-2">
                <div className="text-white text-xs truncate" title={color.name}>
                    {color.name}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400 font-mono">
                        #{color.rgb}
                    </span>
                    {color.is_trans && (
                        <span className="text-blue-400 text-xs">Trans</span>
                    )}
                </div>
            </div>
        </a>
    );
}

// ==================== Utility Components ====================

function LoadingGrid({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-gray-800 rounded-xl overflow-hidden animate-pulse"
                >
                    <div className="aspect-square bg-gray-700" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">{message}</p>
        </div>
    );
}

function Pagination({
    currentPage,
    lastPage,
    onPageChange,
}: {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
}) {
    if (lastPage <= 1) return null;

    const pages = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(lastPage, start + showPages - 1);
    start = Math.max(1, end - showPages + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                ««
            </button>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                «
            </button>

            {start > 1 && <span className="text-gray-400">...</span>}

            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        page === currentPage
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                    {page}
                </button>
            ))}

            {end < lastPage && <span className="text-gray-400">...</span>}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                »
            </button>
            <button
                onClick={() => onPageChange(lastPage)}
                disabled={currentPage === lastPage}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                »»
            </button>
        </div>
    );
}
