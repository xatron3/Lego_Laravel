import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
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
    CatalogSetPart,
    CatalogSetMinifig,
    CatalogPartSet,
    CatalogPartColor,
    CatalogMinifigSet,
    CatalogThemeSet,
} from "../api";

type DetailType = "set" | "part" | "minifig" | "color" | "theme" | "category";

interface Props {
    type: DetailType;
    id: string;
}

export default function CatalogDetail({ type, id }: Props) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states for each type
    const [set, setSet] = useState<CatalogSet | null>(null);
    const [part, setPart] = useState<CatalogPart | null>(null);
    const [minifig, setMinifig] = useState<CatalogMinifig | null>(null);
    const [color, setColor] = useState<CatalogColor | null>(null);
    const [theme, setTheme] = useState<CatalogTheme | null>(null);
    const [category, setCategory] = useState<CatalogCategory | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                switch (type) {
                    case "set":
                        setSet(await api.getCatalogSet(id));
                        break;
                    case "part":
                        setPart(await api.getCatalogPart(id));
                        break;
                    case "minifig":
                        setMinifig(await api.getCatalogMinifig(id));
                        break;
                    case "color":
                        setColor(await api.getCatalogColor(Number(id)));
                        break;
                    case "theme":
                        setTheme(await api.getCatalogTheme(Number(id)));
                        break;
                    case "category":
                        setCategory(await api.getCatalogCategory(Number(id)));
                        break;
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load data",
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [type, id]);

    const goBack = () => {
        router.visit("/catalog");
    };

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
                {/* Back Button */}
                <button
                    onClick={goBack}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Catalog
                </button>

                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={() => window.location.reload()}
                    />
                ) : (
                    <>
                        {type === "set" && set && <SetDetail set={set} />}
                        {type === "part" && part && <PartDetail part={part} />}
                        {type === "minifig" && minifig && (
                            <MinifigDetail minifig={minifig} />
                        )}
                        {type === "color" && color && (
                            <ColorDetail color={color} />
                        )}
                        {type === "theme" && theme && (
                            <ThemeDetail theme={theme} />
                        )}
                        {type === "category" && category && (
                            <CategoryDetail category={category} />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

// ==================== Set Detail ====================
function SetDetail({ set }: { set: CatalogSet }) {
    const [imgError, setImgError] = useState(false);
    const [activeTab, setActiveTab] = useState<"parts" | "minifigs">("parts");

    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Image */}
                    <div className="lg:w-1/3">
                        <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                            {!imgError ? (
                                <img
                                    src={set.image_url}
                                    alt={set.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-8xl">🏗️</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span className="text-yellow-400 font-mono text-lg">
                                    {set.set_num}
                                </span>
                                <h1 className="text-3xl font-bold text-white mt-1">
                                    {set.name}
                                </h1>
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
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Theme:</span>
                                <a
                                    href={`/catalog/theme/${set.theme.id}`}
                                    className="text-yellow-400 hover:text-yellow-300"
                                >
                                    {set.theme.parent &&
                                        `${set.theme.parent.name} > `}
                                    {set.theme.name}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab("parts")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "parts"
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                    Parts ({set.parts_count || 0})
                </button>
                <button
                    onClick={() => setActiveTab("minifigs")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "minifigs"
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                    Minifigs ({set.minifigs_count || 0})
                </button>
            </div>

            {/* Parts List */}
            {activeTab === "parts" && set.parts && (
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
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 text-center text-gray-300 font-medium">
                                        Buy
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {set.parts.map((part, idx) => (
                                    <PartRow key={idx} part={part} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Minifigs List */}
            {activeTab === "minifigs" && set.minifigs_list && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {set.minifigs_list.map((fig) => (
                        <MinifigCard key={fig.fig_num} minifig={fig} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PartRow({ part }: { part: CatalogSetPart }) {
    const [imgError, setImgError] = useState(false);
    const [photoError, setPhotoError] = useState(false);

    // Determine which image to show
    const imageUrl = !imgError
        ? part.image_url
        : !photoError && part.photo_url
          ? part.photo_url
          : null;

    return (
        <tr className="hover:bg-gray-750">
            <td className="px-4 py-3">
                <a
                    href={`/catalog/part/${part.part_num}`}
                    className="flex items-center gap-3 group"
                >
                    <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={part.name}
                                className="w-full h-full object-contain"
                                onError={() => {
                                    if (!imgError) {
                                        setImgError(true);
                                    } else {
                                        setPhotoError(true);
                                    }
                                }}
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

function MinifigCard({ minifig }: { minifig: CatalogSetMinifig }) {
    const [imgError, setImgError] = useState(false);

    return (
        <a
            href={`/catalog/minifig/${minifig.fig_num}`}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {!imgError ? (
                    <img
                        src={minifig.image_url}
                        alt={minifig.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        onError={() => setImgError(true)}
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

// ==================== Part Detail ====================
function PartDetail({ part }: { part: CatalogPart }) {
    const [imgError, setImgError] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const [selectedColor, setSelectedColor] = useState<CatalogPartColor | null>(
        part.available_colors?.[0] || null,
    );

    // Determine which image to show
    const selectedImageUrl = selectedColor?.image_url || part.image_url;
    const selectedPhotoUrl = selectedColor?.photo_url || part.photo_url;
    const imageUrl = !imgError
        ? selectedImageUrl
        : !photoError && selectedPhotoUrl
          ? selectedPhotoUrl
          : null;

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
                                    alt={part.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={() => {
                                        if (!imgError) {
                                            setImgError(true);
                                        } else {
                                            setPhotoError(true);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-8xl">🧱</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span className="text-yellow-400 font-mono text-lg">
                                    {part.part_num}
                                </span>
                                <h1 className="text-3xl font-bold text-white mt-1">
                                    {part.name}
                                </h1>
                            </div>
                            <BricklinkButton url={part.bricklink_url} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            <StatCard
                                label="Category"
                                value={part.category?.name || "Unknown"}
                                icon="📁"
                            />
                            <StatCard
                                label="Colors"
                                value={(
                                    part.available_colors?.length || 0
                                ).toString()}
                                icon="🎨"
                            />
                            <StatCard
                                label="In Sets"
                                value={(
                                    part.in_sets_count || 0
                                ).toLocaleString()}
                                icon="🏗️"
                            />
                        </div>

                        {/* Color Selector */}
                        {part.available_colors &&
                            part.available_colors.length > 0 && (
                                <div>
                                    <h3 className="text-gray-400 text-sm mb-2">
                                        Available Colors (
                                        {part.available_colors.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {part.available_colors
                                            .slice(0, 30)
                                            .map((color) => (
                                                <button
                                                    key={color.id}
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        setImgError(false);
                                                        setPhotoError(false);
                                                    }}
                                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                        selectedColor?.id ===
                                                        color.id
                                                            ? "border-yellow-400 scale-110"
                                                            : "border-gray-600 hover:border-gray-500"
                                                    }`}
                                                    style={{
                                                        backgroundColor: `#${color.rgb}`,
                                                    }}
                                                    title={color.name}
                                                />
                                            ))}
                                        {part.available_colors.length > 30 && (
                                            <span className="text-gray-400 text-sm flex items-center">
                                                +
                                                {part.available_colors.length -
                                                    30}{" "}
                                                more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Sets containing this part */}
            {part.in_sets && part.in_sets.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Found in {part.in_sets_count?.toLocaleString()} Sets
                        {part.in_sets_count && part.in_sets_count > 50 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing top 50)
                            </span>
                        )}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {part.in_sets.map((s) => (
                            <SetCard key={s.set_num} set={s} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SetCard({ set }: { set: CatalogPartSet | CatalogMinifigSet }) {
    const [imgError, setImgError] = useState(false);

    return (
        <a
            href={`/catalog/set/${set.set_num}`}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {!imgError ? (
                    <img
                        src={set.image_url}
                        alt={set.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🏗️</span>
                    </div>
                )}
                {set.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-sm font-bold">
                        {set.quantity}×
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="text-yellow-400 text-xs font-mono mb-1">
                    {set.set_num}
                </div>
                <div className="text-white text-sm truncate" title={set.name}>
                    {set.name}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{set.year}</span>
                    <span>{set.num_parts} pcs</span>
                </div>
            </div>
        </a>
    );
}

// ==================== Minifig Detail ====================
function MinifigDetail({ minifig }: { minifig: CatalogMinifig }) {
    const [imgError, setImgError] = useState(false);

    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Image */}
                    <div className="lg:w-1/3">
                        <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                            {!imgError ? (
                                <img
                                    src={minifig.image_url}
                                    alt={minifig.name}
                                    className="w-full h-full object-contain p-4"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="text-8xl">🧑</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-2/3">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span className="text-yellow-400 font-mono text-lg">
                                    {minifig.fig_num}
                                </span>
                                <h1 className="text-3xl font-bold text-white mt-1">
                                    {minifig.name}
                                </h1>
                            </div>
                            <BricklinkButton url={minifig.bricklink_url} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <StatCard
                                label="Parts"
                                value={minifig.num_parts.toString()}
                                icon="🧱"
                            />
                            <StatCard
                                label="In Sets"
                                value={(minifig.in_sets_count || 0).toString()}
                                icon="🏗️"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sets containing this minifig */}
            {minifig.in_sets && minifig.in_sets.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Found in {minifig.in_sets_count} Sets
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {minifig.in_sets.map((s) => (
                            <SetCard key={s.set_num} set={s} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Color Detail ====================
function ColorDetail({ color }: { color: CatalogColor }) {
    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Color Swatch */}
                    <div className="lg:w-1/4">
                        <div
                            className="aspect-square rounded-xl relative overflow-hidden"
                            style={{ backgroundColor: `#${color.rgb}` }}
                        >
                            {color.is_trans && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:w-3/4">
                        <h1 className="text-3xl font-bold text-white mb-4">
                            {color.name}
                        </h1>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard
                                label="Color ID"
                                value={color.id.toString()}
                                icon="🔢"
                            />
                            <StatCard
                                label="RGB"
                                value={`#${color.rgb}`}
                                icon="🎨"
                            />
                            <StatCard
                                label="Type"
                                value={color.is_trans ? "Transparent" : "Solid"}
                                icon={color.is_trans ? "💎" : "🧱"}
                            />
                            <StatCard
                                label="Parts"
                                value={(
                                    color.parts_count || 0
                                ).toLocaleString()}
                                icon="🔧"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Parts in this color */}
            {color.parts && color.parts.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Parts in this Color
                        {color.parts_count && color.parts_count > 100 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing first 100)
                            </span>
                        )}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {color.parts.map((p) => (
                            <ColorPartCard key={p.part_num} part={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ColorPartCard({
    part,
}: {
    part: {
        part_num: string;
        name: string;
        image_url: string;
        photo_url?: string;
        bricklink_url?: string;
    };
}) {
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
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
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

// ==================== Theme Detail ====================
function ThemeDetail({ theme }: { theme: CatalogTheme }) {
    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        {theme.parent && (
                            <a
                                href={`/catalog/theme/${theme.parent.id}`}
                                className="text-yellow-400 hover:text-yellow-300 text-sm"
                            >
                                ← {theme.parent.name}
                            </a>
                        )}
                        <h1 className="text-3xl font-bold text-white mt-1">
                            {theme.name}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label="Sets"
                        value={(theme.sets_count || 0).toLocaleString()}
                        icon="🏗️"
                    />
                    <StatCard
                        label="Subthemes"
                        value={(theme.children?.length || 0).toString()}
                        icon="📁"
                    />
                </div>
            </div>

            {/* Subthemes */}
            {theme.children && theme.children.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Subthemes
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {theme.children.map((child) => (
                            <a
                                key={child.id}
                                href={`/catalog/theme/${child.id}`}
                                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500 transition-colors"
                            >
                                <div className="text-white font-medium">
                                    {child.name}
                                </div>
                                <div className="text-gray-400 text-sm mt-1">
                                    {child.sets_count || 0} sets
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Sets in this theme */}
            {theme.sets_list && theme.sets_list.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Sets ({theme.sets_count})
                        {theme.sets_count && theme.sets_count > 50 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing newest 50)
                            </span>
                        )}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {theme.sets_list.map((s) => (
                            <ThemeSetCard key={s.set_num} set={s} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ThemeSetCard({ set }: { set: CatalogThemeSet }) {
    const [imgError, setImgError] = useState(false);

    return (
        <a
            href={`/catalog/set/${set.set_num}`}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group"
        >
            <div className="aspect-square bg-gray-700 relative overflow-hidden">
                {!imgError ? (
                    <img
                        src={set.image_url}
                        alt={set.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-4xl">🏗️</span>
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="text-yellow-400 text-xs font-mono mb-1">
                    {set.set_num}
                </div>
                <div className="text-white text-sm truncate" title={set.name}>
                    {set.name}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{set.year}</span>
                    <span>{set.num_parts} pcs</span>
                </div>
            </div>
        </a>
    );
}

// ==================== Category Detail ====================
function CategoryDetail({ category }: { category: CatalogCategory }) {
    return (
        <div>
            {/* Header Section */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <h1 className="text-3xl font-bold text-white mb-4">
                    {category.name}
                </h1>
                <StatCard
                    label="Parts in Category"
                    value={(category.parts_count || 0).toLocaleString()}
                    icon="🧱"
                />
            </div>

            {/* Parts in this category */}
            {category.parts_list && category.parts_list.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Parts
                        {category.parts_count && category.parts_count > 100 && (
                            <span className="text-gray-400 text-sm font-normal ml-2">
                                (showing first 100)
                            </span>
                        )}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {category.parts_list.map((p) => (
                            <ColorPartCard key={p.part_num} part={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Shared Components ====================

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: string;
}) {
    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div className="text-white text-xl font-bold">{value}</div>
        </div>
    );
}

function BricklinkButton({ url }: { url?: string }) {
    if (!url) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            Buy on BrickLink
        </a>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
            <p className="text-gray-400">Loading...</p>
        </div>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-gray-400 text-lg mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}
