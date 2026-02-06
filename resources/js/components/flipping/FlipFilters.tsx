import { useState, useEffect } from "react";

interface FlipFiltersProps {
    filters: Record<string, string | undefined>;
    platforms: string[];
    onChange: (filters: Record<string, string | undefined>) => void;
}

export default function FlipFilters({
    filters,
    platforms,
    onChange,
}: FlipFiltersProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<
        typeof setTimeout
    > | null>(null);

    useEffect(() => {
        setSearch(filters.search || "");
    }, [filters.search]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(() => {
            onChange({ ...filters, search: value || undefined });
        }, 400);
        setDebounceTimer(timer);
    };

    const handleFilterChange = (key: string, value: string) => {
        onChange({ ...filters, [key]: value || undefined });
    };

    const clearFilters = () => {
        setSearch("");
        onChange({});
    };

    const hasActiveFilters =
        filters.type || filters.status || filters.platform || filters.search;

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                </div>

                {/* Type filter */}
                <select
                    value={filters.type || ""}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                    <option value="">All Types</option>
                    <option value="buy">Buys</option>
                    <option value="sell">Sales</option>
                </select>

                {/* Status filter */}
                <select
                    value={filters.status || ""}
                    onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                    }
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="partial">Partial</option>
                    <option value="complete">Complete</option>
                </select>

                {/* Platform filter */}
                {platforms.length > 0 && (
                    <select
                        value={filters.platform || ""}
                        onChange={(e) =>
                            handleFilterChange("platform", e.target.value)
                        }
                        className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                        <option value="">All Platforms</option>
                        {platforms.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                )}

                {/* Sort */}
                <select
                    value={`${filters.sort || "transaction_date"}_${filters.direction || "desc"}`}
                    onChange={(e) => {
                        const [sort, direction] = e.target.value.split("_");
                        onChange({ ...filters, sort, direction });
                    }}
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                    <option value="transaction_date_desc">Newest First</option>
                    <option value="transaction_date_asc">Oldest First</option>
                    <option value="price_desc">Highest Price</option>
                    <option value="price_asc">Lowest Price</option>
                    <option value="title_asc">Title A-Z</option>
                    <option value="title_desc">Title Z-A</option>
                </select>

                {/* Clear */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                        title="Clear filters"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
