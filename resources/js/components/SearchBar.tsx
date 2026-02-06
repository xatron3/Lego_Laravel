import { useState, useEffect, useRef, useCallback } from "react";
import { router } from "@inertiajs/react";
import { debounce } from "../utils/debounce";

interface SearchResult {
    type: "set" | "moc" | "part" | "minifig" | "theme";
    id: string;
    name: string;
    subtitle: string;
    image_url?: string;
    url: string;
}

interface SearchBarProps {
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function SearchBar({
    className = "",
    placeholder = "Search sets, parts, minifigs...",
    autoFocus = false,
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("recentSearches");
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent searches:", e);
            }
        }
    }, []);

    // Save to recent searches
    const saveToRecentSearches = (searchQuery: string) => {
        const updated = [
            searchQuery,
            ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, 5); // Keep only 5 recent searches
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem("recentSearches");
    };

    // Keyboard shortcut (Ctrl/Cmd + K) to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search function
    const performSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/catalog/search?q=${encodeURIComponent(searchQuery)}`,
                );
                const data = await response.json();
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        if (value.length >= 2) {
            setIsLoading(true);
            performSearch(value);
        } else {
            setResults([]);
            setIsOpen(value.length === 0 && recentSearches.length > 0);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < results.length - 1 ? prev + 1 : prev,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleResultClick(results[selectedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleResultClick = (result: SearchResult) => {
        saveToRecentSearches(result.name);
        router.visit(result.url);
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
        setIsLoading(true);
        performSearch(search);
        inputRef.current?.focus();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "set":
                return (
                    <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                    </svg>
                );
            case "moc":
                return (
                    <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                );
            case "part":
                return (
                    <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                    </svg>
                );
            case "minifig":
                return (
                    <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                );
            case "theme":
                return (
                    <svg
                        className="w-5 h-5 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getTypeBadge = (type: string) => {
        const styles = {
            set: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            moc: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            part: "bg-green-500/10 text-green-400 border-green-500/20",
            minifig: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            theme: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        };

        return (
            <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[type as keyof typeof styles] || ""}`}
            >
                {type.toUpperCase()}
            </span>
        );
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) {
                            setIsOpen(true);
                        } else if (
                            query.length === 0 &&
                            recentSearches.length > 0
                        ) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg pl-10 pr-20 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                    ) : (
                        <svg
                            className="w-5 h-5 text-gray-400"
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
                    )}
                </div>
                {/* Keyboard Shortcut Hint & Clear Button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query ? (
                        <button
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                setIsOpen(false);
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
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
                    ) : (
                        <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-700 border border-gray-600 rounded">
                            ⌘K
                        </kbd>
                    )}
                </div>
            </div>

            {/* Autocomplete Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto search-results-scrollbar autocomplete-dropdown">
                    {results.map((result, index) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                index === selectedIndex
                                    ? "bg-gray-700"
                                    : "hover:bg-gray-750"
                            } ${index > 0 ? "border-t border-gray-700/50" : ""}`}
                        >
                            {/* Icon */}
                            <div className="shrink-0">
                                {getTypeIcon(result.type)}
                            </div>

                            {/* Image */}
                            {result.image_url && (
                                <img
                                    src={result.image_url}
                                    alt={result.name}
                                    className="w-12 h-12 object-contain rounded bg-gray-700/50"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">
                                    {result.name}
                                </div>
                                <div className="text-sm text-gray-400 truncate">
                                    {result.subtitle}
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="shrink-0">
                                {getTypeBadge(result.type)}
                            </div>

                            {/* Arrow */}
                            <div className="shrink-0 text-gray-500">
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
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen &&
                !isLoading &&
                query.length >= 2 &&
                results.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 text-center z-50 autocomplete-dropdown">
                        <svg
                            className="w-12 h-12 text-gray-600 mx-auto mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-gray-400 text-sm">
                            No results found for "{query}"
                        </p>
                    </div>
                )}

            {/* Recent Searches */}
            {isOpen && !query && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 autocomplete-dropdown">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Recent Searches
                        </span>
                        <button
                            onClick={clearRecentSearches}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    {recentSearches.map((search, index) => (
                        <div
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors border-t border-gray-700/50 first:border-t-0"
                        >
                            <svg
                                className="w-5 h-5 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-gray-300">{search}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
