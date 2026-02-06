import { useState, useRef, useEffect } from "react";

interface FlipItemSearchProps {
    onSelect: (
        type: "set" | "minifig",
        identifier: string,
        label: string,
    ) => void;
}

interface SearchResult {
    type: "set" | "minifig";
    id: string;
    name: string;
    extra?: string;
    image_url?: string;
}

export default function FlipItemSearch({ onSelect }: FlipItemSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchMode, setSearchMode] = useState<"set" | "minifig">("set");
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const doSearch = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const endpoint =
                searchMode === "set"
                    ? `/api/catalog/sets?search=${encodeURIComponent(searchQuery)}&per_page=8`
                    : `/api/catalog/minifigs?search=${encodeURIComponent(searchQuery)}&per_page=8`;

            const response = await fetch(endpoint, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });

            if (response.ok) {
                const data = await response.json();
                const items = data.data || data;

                if (searchMode === "set") {
                    setResults(
                        items.map((s: any) => ({
                            type: "set" as const,
                            id: s.set_num,
                            name: s.name,
                            extra: `${s.year || ""} · ${s.num_parts || 0} parts`,
                            image_url: `https://cdn.rebrickable.com/media/sets/${s.set_num}.jpg`,
                        })),
                    );
                } else {
                    setResults(
                        items.map((m: any) => ({
                            type: "minifig" as const,
                            id: m.fig_num,
                            name: m.name,
                            extra: `${m.num_parts || 0} parts`,
                            image_url: `https://cdn.rebrickable.com/media/sets/minifigs/${m.fig_num}.jpg`,
                        })),
                    );
                }
            }
        } catch {
            // Silently fail
        } finally {
            setIsSearching(false);
        }
    };

    const handleChange = (value: string) => {
        setQuery(value);
        setShowResults(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(value), 300);
    };

    const handleSelect = (result: SearchResult) => {
        onSelect(result.type, result.id, `${result.id} - ${result.name}`);
        setQuery("");
        setResults([]);
        setShowResults(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex gap-2">
                {/* Mode toggle */}
                <div className="flex bg-gray-900 border border-gray-600 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            setSearchMode("set");
                            setResults([]);
                            setQuery("");
                        }}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                            searchMode === "set"
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Sets
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchMode("minifig");
                            setResults([]);
                            setQuery("");
                        }}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                            searchMode === "minifig"
                                ? "bg-purple-600 text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Minifigs
                    </button>
                </div>

                {/* Search input */}
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
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={() =>
                            query.length >= 2 && setShowResults(true)
                        }
                        placeholder={
                            searchMode === "set"
                                ? "Search sets by name or number..."
                                : "Search minifigs by name or number..."
                        }
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={`${result.type}-${result.id}`}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700/50 transition-colors text-left"
                        >
                            <img
                                src={result.image_url}
                                alt=""
                                className="w-10 h-10 object-contain bg-white rounded"
                                onError={(e) => {
                                    (
                                        e.target as HTMLImageElement
                                    ).style.display = "none";
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">
                                    <span className="text-gray-400 mr-1">
                                        {result.id}
                                    </span>
                                    {result.name}
                                </div>
                                {result.extra && (
                                    <div className="text-xs text-gray-500">
                                        {result.extra}
                                    </div>
                                )}
                            </div>
                            <svg
                                className="w-4 h-4 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </button>
                    ))}
                </div>
            )}

            {showResults &&
                query.length >= 2 &&
                results.length === 0 &&
                !isSearching && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-600 rounded-lg p-4 text-center">
                        <p className="text-gray-500 text-sm">
                            No {searchMode === "set" ? "sets" : "minifigs"}{" "}
                            found
                        </p>
                    </div>
                )}
        </div>
    );
}
