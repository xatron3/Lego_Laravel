import { useState, useMemo } from "react";
import { useImageFallback } from "../../hooks/useImageFallback";
import type { CatalogSet, CatalogSetPart, CatalogSetMinifig } from "../../api";
import BricklinkButton from "./BricklinkButton";
import InstructionsButton from "./InstructionsButton";
import StatCard from "./StatCard";
import PartsDisplay, { PartDisplayItem } from "../PartsDisplay";
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

    // Transform catalog parts to PartsDisplay format
    const partsForDisplay = useMemo<PartDisplayItem[]>(() => {
        if (!set.parts) return [];
        return set.parts.map((part) => ({
            partId: part.part_num,
            name: part.name,
            colorId: part.color_id,
            colorName: part.color_name,
            colorRgb: part.color_rgb,
            count: part.quantity,
            imageUrl: part.image_url,
            photoUrl: part.photo_url,
            category: part.category,
            isSpare: part.is_spare,
            bricklinkUrl: part.bricklink_url,
        }));
    }, [set.parts]);

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
                            {set.set_num.startsWith("MOC-") ? (
                                <a
                                    href={`/models/${set.set_num}`}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    View MOC
                                </a>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2.5">
                                    <InstructionsButton setNum={set.set_num} />
                                    <BricklinkButton url={set.bricklink_url} />
                                </div>
                            )}
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
            {activeTab === "parts" && (
                <PartsDisplay
                    parts={partsForDisplay}
                    title={`Parts in ${set.name}`}
                    subtitle={`${set.parts_count} unique parts, ${set.total_pieces || set.num_parts} total pieces`}
                    defaultView="table"
                    showViewToggle={true}
                    showSearch={true}
                    allowedViews={["grid", "table", "compact"]}
                />
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
