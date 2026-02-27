import { useState, useMemo } from "react";
import { useImageFallback } from "../hooks/useImageFallback";

// ==================== Types ====================

export interface PartDisplayItem {
    partId: string;
    name?: string;
    colorId?: number;
    colorName?: string;
    colorRgb?: string;
    count: number;
    imageUrl?: string;
    photoUrl?: string;
    category?: string;
    isSpare?: boolean;
    bricklinkUrl?: string;
}

type ViewMode = "grid" | "table" | "compact";

interface PartsDisplayProps {
    parts: PartDisplayItem[];
    title?: string;
    subtitle?: string;
    defaultView?: ViewMode;
    showViewToggle?: boolean;
    showSearch?: boolean;
    allowedViews?: ViewMode[];
    className?: string;
    emptyMessage?: string;
}

// ==================== Main Component ====================

/**
 * Unified parts list component supporting grid, table, and compact views.
 * Reusable across Viewer, Catalog, and other pages.
 */
export default function PartsDisplay({
    parts,
    title = "Parts List",
    subtitle,
    defaultView = "grid",
    showViewToggle = true,
    showSearch = true,
    allowedViews = ["grid", "table", "compact"],
    className = "",
    emptyMessage = "No parts to display",
}: PartsDisplayProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter parts based on search query
    const filteredParts = useMemo(() => {
        if (!searchQuery.trim()) return parts;

        const query = searchQuery.toLowerCase();
        return parts.filter(
            (part) =>
                part.partId.toLowerCase().includes(query) ||
                part.name?.toLowerCase().includes(query) ||
                part.colorName?.toLowerCase().includes(query) ||
                part.category?.toLowerCase().includes(query),
        );
    }, [parts, searchQuery]);

    const totalPieces = useMemo(
        () => filteredParts.reduce((sum, p) => sum + p.count, 0),
        [filteredParts],
    );

    return (
        <div className={`bg-gray-800 rounded-xl ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
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
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-sm text-gray-400 mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {showViewToggle && (
                        <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
                            {allowedViews.includes("grid") && (
                                <ViewButton
                                    active={viewMode === "grid"}
                                    onClick={() => setViewMode("grid")}
                                    icon="grid"
                                    title="Grid View"
                                />
                            )}
                            {allowedViews.includes("table") && (
                                <ViewButton
                                    active={viewMode === "table"}
                                    onClick={() => setViewMode("table")}
                                    icon="table"
                                    title="Table View"
                                />
                            )}
                            {allowedViews.includes("compact") && (
                                <ViewButton
                                    active={viewMode === "compact"}
                                    onClick={() => setViewMode("compact")}
                                    icon="list"
                                    title="Compact View"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Search bar */}
                {showSearch && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {filteredParts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {emptyMessage}
                    </p>
                ) : (
                    <>
                        {viewMode === "grid" && (
                            <GridView parts={filteredParts} />
                        )}
                        {viewMode === "table" && (
                            <TableView parts={filteredParts} />
                        )}
                        {viewMode === "compact" && (
                            <CompactView parts={filteredParts} />
                        )}
                    </>
                )}
            </div>

            {/* Footer Stats */}
            {filteredParts.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-700 flex justify-between text-sm">
                    <span className="text-gray-400">Unique parts:</span>
                    <span className="text-white font-medium">
                        {filteredParts.length} types ({totalPieces} pieces)
                    </span>
                </div>
            )}
        </div>
    );
}

// ==================== View Toggle Button ====================

interface ViewButtonProps {
    active: boolean;
    onClick: () => void;
    icon: "grid" | "table" | "list";
    title: string;
}

function ViewButton({ active, onClick, icon, title }: ViewButtonProps) {
    const icons = {
        grid: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 3H3v7h7V3zm11 0h-7v7h7V3zM10 14H3v7h7v-7zm11 0h-7v7h7v-7z" />
            </svg>
        ),
        table: (
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
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
            </svg>
        ),
        list: (
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
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
        ),
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded transition-colors ${
                active
                    ? "bg-yellow-400 text-gray-900"
                    : "text-gray-400 hover:text-white hover:bg-gray-600"
            }`}
        >
            {icons[icon]}
        </button>
    );
}

// ==================== Grid View ====================

interface ViewProps {
    parts: PartDisplayItem[];
}

function GridView({ parts }: ViewProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {parts.map((part, idx) => (
                <GridCard
                    key={`${part.partId}-${part.colorId}-${idx}`}
                    part={part}
                />
            ))}
        </div>
    );
}

interface CardProps {
    part: PartDisplayItem;
}

function GridCard({ part }: CardProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.imageUrl || "",
        part.photoUrl,
    );

    return (
        <div className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition-colors">
            {/* Image */}
            <div className="aspect-square bg-gray-800 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={part.name || part.partId}
                        className="max-w-full max-h-full object-contain p-2"
                        onError={handleError}
                    />
                ) : (
                    <span className="text-3xl">🧱</span>
                )}
                {/* Quantity Badge */}
                <div className="absolute top-1 right-1 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                    {part.count}×
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
                <div
                    className="text-xs font-mono text-yellow-400 truncate"
                    title={part.partId}
                >
                    {part.partId}
                </div>
                {part.name && (
                    <div
                        className="text-xs text-gray-300 truncate"
                        title={part.name}
                    >
                        {part.name}
                    </div>
                )}
                {part.colorName && (
                    <div className="flex items-center gap-1">
                        {part.colorRgb && (
                            <div
                                className="w-3 h-3 rounded border border-gray-600"
                                style={{ backgroundColor: `#${part.colorRgb}` }}
                            />
                        )}
                        <span className="text-xs text-gray-400 truncate">
                            {part.colorName}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== Table View ====================

function TableView({ parts }: ViewProps) {
    return (
        <div className="overflow-x-auto -mx-4">
            <table className="w-full">
                <thead className="bg-gray-700 sticky top-0">
                    <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                            Part
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                            Color
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                            Category
                        </th>
                        <th className="px-4 py-3 text-center text-gray-300 font-medium">
                            Quantity
                        </th>
                        <th className="px-4 py-3 text-center text-gray-300 font-medium">
                            Link
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {parts.map((part, idx) => (
                        <TableRow
                            key={`${part.partId}-${part.colorId}-${idx}`}
                            part={part}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TableRow({ part }: CardProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.imageUrl || "",
        part.photoUrl,
    );

    return (
        <tr className="hover:bg-gray-750 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={part.name || part.partId}
                                className="w-full h-full object-contain"
                                onError={handleError}
                            />
                        ) : (
                            <span className="text-xl">🧱</span>
                        )}
                    </div>
                    <div>
                        <div className="text-white font-medium">
                            {part.name || part.partId}
                        </div>
                        <div className="text-yellow-400 text-sm font-mono">
                            {part.partId}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                {part.colorName ? (
                    <div className="flex items-center gap-2">
                        {part.colorRgb && (
                            <div
                                className="w-5 h-5 rounded border border-gray-600"
                                style={{ backgroundColor: `#${part.colorRgb}` }}
                            />
                        )}
                        <span className="text-gray-300">{part.colorName}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">—</span>
                )}
            </td>
            <td className="px-4 py-3 text-gray-400">{part.category || "—"}</td>
            <td className="px-4 py-3 text-center">
                <span className="bg-gray-700 px-2 py-1 rounded text-white font-medium">
                    {part.count}×
                </span>
            </td>
            <td className="px-4 py-3 text-center">
                {part.bricklinkUrl ? (
                    <a
                        href={part.bricklinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                        BrickLink
                    </a>
                ) : (
                    <span className="text-gray-500">—</span>
                )}
            </td>
        </tr>
    );
}

// ==================== Compact View ====================

function CompactView({ parts }: ViewProps) {
    return (
        <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {parts.map((part, idx) => (
                <CompactRow
                    key={`${part.partId}-${part.colorId}-${idx}`}
                    part={part}
                />
            ))}
        </div>
    );
}

function CompactRow({ part }: CardProps) {
    return (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {part.colorRgb && (
                    <div
                        className="w-4 h-4 rounded border border-gray-600 shrink-0"
                        style={{ backgroundColor: `#${part.colorRgb}` }}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-mono truncate">
                        {part.partId}
                    </div>
                    {part.name && (
                        <div className="text-xs text-gray-400 truncate">
                            {part.name}
                        </div>
                    )}
                </div>
            </div>
            <span className="text-yellow-400 font-medium ml-2">
                ×{part.count}
            </span>
        </div>
    );
}
