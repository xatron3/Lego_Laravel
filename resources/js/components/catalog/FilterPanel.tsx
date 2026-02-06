import { useState, ReactNode } from "react";

interface FilterPanelProps {
    children: ReactNode;
    /** Count of active filters */
    activeCount?: number;
}

/**
 * Collapsible filter panel with modern styling.
 * Wraps filter inputs and shows active filter count badge.
 */
export default function FilterPanel({
    children,
    activeCount = 0,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
            >
                <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
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
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                </svg>
                Filters
                {activeCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-500 text-gray-900 rounded-full">
                        {activeCount}
                    </span>
                )}
            </button>
            {isExpanded && (
                <div className="flex flex-wrap gap-3 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                    {children}
                </div>
            )}
        </div>
    );
}

// ==================== Reusable Filter Inputs ====================

interface SelectFilterProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
}

export function SelectFilter({
    label,
    value,
    onChange,
    options,
    className = "",
}: SelectFilterProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="text-xs text-gray-400 font-medium">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface NumberFilterProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    className?: string;
}

export function NumberFilter({
    label,
    value,
    onChange,
    placeholder,
    min,
    max,
    className = "",
}: NumberFilterProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="text-xs text-gray-400 font-medium">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                max={max}
                className="w-28 px-3 py-2 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            />
        </div>
    );
}

interface ChipFilterProps {
    options: { value: string; label: string }[];
    selected: string;
    onChange: (value: string) => void;
}

export function ChipFilter({ options, selected, onChange }: ChipFilterProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selected === opt.value
                            ? "bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/20"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
