interface ViewToggleProps {
    view: "grid" | "table";
    onViewChange: (view: "grid" | "table") => void;
}

/**
 * Toggle between grid and table view modes.
 */
export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 p-0.5">
            <button
                onClick={() => onViewChange("grid")}
                className={`p-2 rounded-md transition-colors ${
                    view === "grid"
                        ? "bg-yellow-500 text-gray-900"
                        : "text-gray-400 hover:text-white"
                }`}
                title="Grid view"
            >
                <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                </svg>
            </button>
            <button
                onClick={() => onViewChange("table")}
                className={`p-2 rounded-md transition-colors ${
                    view === "table"
                        ? "bg-yellow-500 text-gray-900"
                        : "text-gray-400 hover:text-white"
                }`}
                title="Table view"
            >
                <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                </svg>
            </button>
        </div>
    );
}
