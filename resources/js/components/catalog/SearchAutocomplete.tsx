import { useState, useEffect, useRef } from "react";
import { api, SearchResult } from "../../api";

interface SearchAutocompleteProps {
    scope?: "all" | "sets" | "mocs" | "parts" | "minifigs" | "themes";
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
}

const typeIcons: Record<string, string> = {
    set: "📦",
    moc: "🔨",
    part: "🧱",
    minifig: "🧑",
};

const typeLabels: Record<string, string> = {
    set: "Set",
    moc: "MOC",
    part: "Part",
    minifig: "Minifig",
};

/**
 * Search input with autocomplete dropdown.
 * Searches across catalog categories with debounced API calls.
 */
export default function SearchAutocomplete({
    scope = "all",
    placeholder = "Search sets, parts, minifigs...",
    onSearch,
    className = "",
}: SearchAutocompleteProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            const data = await api.searchCatalog(query, scope);
            setResults(data);
            setIsOpen(data.length > 0);
            setIsLoading(false);
            setSelectedIndex(-1);
        }, 250);

        return () => clearTimeout(timer);
    }, [query, scope]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                window.location.href = results[selectedIndex].url;
            } else if (onSearch) {
                onSearch(query);
                setIsOpen(false);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(query);
            setIsOpen(false);
        }
    };

    // Group results by type
    const groupedResults = results.reduce(
        (acc, result) => {
            if (!acc[result.type]) acc[result.type] = [];
            acc[result.type].push(result);
            return acc;
        },
        {} as Record<string, SearchResult[]>,
    );

    let flatIndex = -1;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => results.length > 0 && setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 pl-12 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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
                    {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    {!isLoading && query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                setIsOpen(false);
                                onSearch?.("");
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <svg
                                className="w-4 h-4"
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
            </form>

            {/* Autocomplete Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-100 overflow-y-auto">
                    {Object.entries(groupedResults).map(([type, items]) => (
                        <div key={type}>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-800/80 sticky top-0 backdrop-blur-sm border-b border-gray-700">
                                {typeIcons[type]} {typeLabels[type]}s
                            </div>
                            {items.map((result) => {
                                flatIndex++;
                                const idx = flatIndex;
                                return (
                                    <a
                                        key={`${result.type}-${result.id}`}
                                        href={result.url}
                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                            idx === selectedIndex
                                                ? "bg-gray-700"
                                                : "hover:bg-gray-700/50"
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                                            <img
                                                src={result.image_url}
                                                alt=""
                                                className="w-full h-full object-contain p-0.5"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).style.display = "none";
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-white truncate">
                                                {result.name}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {result.subtitle}
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
