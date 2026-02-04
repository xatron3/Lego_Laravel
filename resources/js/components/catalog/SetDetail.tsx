import { useState } from "react";
import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogSet, CatalogSetPart, CatalogSetMinifig } from "../../api";
import BricklinkButton from "./BricklinkButton";
import StatCard from "./StatCard";
import {
    catalogThemeUrl,
    catalogPartUrl,
    catalogMinifigUrl,
} from "../../utils/seoUrls";

interface SetDetailProps {
    set: CatalogSet;
}

/**
 * Detail view for a LEGO set with parts and minifigs tabs
 */
export default function SetDetail({ set }: SetDetailProps) {
    const { imageUrl, handleError } = useImageFallback(set.image_url);
    const [activeTab, setActiveTab] = useState<"parts" | "minifigs">("parts");

    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Image */}
                    <div className="lg:w-1/3">
                        <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={set.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={handleError}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-6xl">🏗️</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {set.name}
                                </h1>
                                <p className="text-yellow-400 font-mono text-lg">
                                    {set.set_num}
                                </p>
                            </div>
                            <BricklinkButton url={set.bricklink_url} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <StatCard
                                label="Year"
                                value={set.year.toString()}
                                icon="📅"
                            />
                            <StatCard
                                label="Total Pieces"
                                value={(
                                    set.total_pieces || set.num_parts
                                ).toLocaleString()}
                                icon="🧱"
                            />
                            <StatCard
                                label="Unique Parts"
                                value={(set.parts_count || 0).toLocaleString()}
                                icon="🔧"
                            />
                            <StatCard
                                label="Minifigs"
                                value={(set.minifigs_count || 0).toString()}
                                icon="🧑"
                            />
                        </div>

                        {set.theme && (
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="text-gray-400 text-sm mb-1">
                                    Theme
                                </div>
                                <a
                                    href={catalogThemeUrl(set.theme)}
                                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                                >
                                    {set.theme.name}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <TabButton
                    active={activeTab === "parts"}
                    onClick={() => setActiveTab("parts")}
                    label={`Parts (${set.parts_count || 0})`}
                />
                <TabButton
                    active={activeTab === "minifigs"}
                    onClick={() => setActiveTab("minifigs")}
                    label={`Minifigs (${set.minifigs_count || 0})`}
                />
            </div>

            {/* Tab Content */}
            {activeTab === "parts" && set.parts && (
                <PartsTable parts={set.parts} />
            )}
            {activeTab === "minifigs" && set.minifigs_list && (
                <MinifigsGrid minifigs={set.minifigs_list} />
            )}
        </div>
    );
}

// ==================== Sub-components ====================

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                active
                    ? "bg-yellow-500 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
        >
            {label}
        </button>
    );
}

interface PartsTableProps {
    parts: CatalogSetPart[];
}

function PartsTable({ parts }: PartsTableProps) {
    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-700">
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
                            <PartRow
                                key={`${part.part_num}-${part.color_id}-${idx}`}
                                part={part}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface PartRowProps {
    part: CatalogSetPart;
}

function PartRow({ part }: PartRowProps) {
    const { imageUrl, handleError } = useImageFallback(
        part.image_url,
        part.photo_url,
    );

    return (
        <tr className="hover:bg-gray-750">
            <td className="px-4 py-3">
                <a
                    href={catalogPartUrl(part)}
                    className="flex items-center gap-3 group"
                >
                    <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={part.name}
                                className="w-full h-full object-contain"
                                onError={handleError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                🧱
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-white group-hover:text-yellow-400 transition-colors">
                            {part.name}
                        </div>
                        <div className="text-yellow-400 text-sm font-mono">
                            {part.part_num}
                        </div>
                    </div>
                </a>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-5 h-5 rounded border border-gray-600"
                        style={{ backgroundColor: `#${part.color_rgb}` }}
                    />
                    <span className="text-gray-300">{part.color_name}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-gray-400">{part.category}</td>
            <td className="px-4 py-3 text-center">
                <span className="bg-gray-700 px-2 py-1 rounded text-white font-medium">
                    {part.quantity}×
                </span>
                {part.is_spare && (
                    <span className="ml-2 text-xs text-gray-400">(spare)</span>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <a
                    href={part.bricklink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                >
                    BrickLink
                </a>
            </td>
        </tr>
    );
}

interface MinifigsGridProps {
    minifigs: CatalogSetMinifig[];
}

function MinifigsGrid({ minifigs }: MinifigsGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {minifigs.map((fig) => (
                <MinifigCard key={fig.fig_num} minifig={fig} />
            ))}
        </div>
    );
}

interface MinifigCardProps {
    minifig: CatalogSetMinifig;
}

function MinifigCard({ minifig }: MinifigCardProps) {
    const { imageUrl, handleError } = useImageFallback(minifig.image_url);

    return (
        <a
            href={catalogMinifigUrl(minifig)}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={minifig.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        onError={handleError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🧑</span>
                    </div>
                )}
                {minifig.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-sm font-bold">
                        {minifig.quantity}×
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="text-yellow-400 text-xs font-mono mb-1">
                    {minifig.fig_num}
                </div>
                <div
                    className="text-white text-sm truncate"
                    title={minifig.name}
                >
                    {minifig.name}
                </div>
            </div>
        </a>
    );
}
