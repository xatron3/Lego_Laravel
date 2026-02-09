import React, { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LegoModelData } from "../api";
import { mocUrl } from "../utils/seoUrls";

type SortOption = "newest" | "popular" | "price_low" | "price_high" | "name";
type FilterOption = "all" | "free" | "paid";

interface MocsProps {
    initialModels?: LegoModelData[];
    initialSort?: SortOption;
    initialFilter?: FilterOption;
    initialSearch?: string;
}

export default function Mocs({
    initialModels = [],
    initialSort = "newest",
    initialFilter = "all",
    initialSearch = "",
}: MocsProps) {
    const { isAuthenticated, user } = useAuth();
    const { isInCart, addToCart } = useCart();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [models, setModels] = useState<LegoModelData[]>(initialModels);
    const [isLoading, setIsLoading] = useState(false);
    const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
    const [search, setSearch] = useState(initialSearch);
    const [sort, setSort] = useState<SortOption>(initialSort);
    const [filter, setFilter] = useState<FilterOption>(initialFilter);

    // Update state when props change (Inertia navigation)
    useEffect(() => {
        setModels(initialModels);
        setSort(initialSort);
        setFilter(initialFilter);
        setSearch(initialSearch);
        setIsLoading(false);
    }, [initialModels, initialSort, initialFilter, initialSearch]);

    // Reload with new filters
    const reloadModels = (
        newSort?: SortOption,
        newFilter?: FilterOption,
        newSearch?: string,
    ) => {
        setIsLoading(true);
        router.get(
            "/store",
            {
                sort: newSort ?? sort,
                filter: newFilter ?? filter,
                search: (newSearch ?? search) || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["initialModels"],
            },
        );
    };

    useEffect(() => {
        if (sort !== initialSort || filter !== initialFilter) {
            reloadModels(sort, filter, search);
        }
    }, [sort, filter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        reloadModels(sort, filter, search);
    };

    const handleAddToCart = async (e: React.MouseEvent, modelId: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        setAddingToCartId(modelId);
        try {
            await addToCart(modelId);
        } catch (error: any) {
            console.error("Failed to add to cart:", error);
        } finally {
            setAddingToCartId(null);
        }
    };

    const filteredModels = models.filter((model) => {
        if (!search) return true;
        return (
            model.name.toLowerCase().includes(search.toLowerCase()) ||
            model.description?.toLowerCase().includes(search.toLowerCase())
        );
    });

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                onOpenAuthModal={() => setShowAuthModal(true)}
                currentPage="store"
            />

            {/* Main Content */}
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Model Store
                        </h1>
                        <p className="text-gray-400">
                            Discover and collect amazing LEGO creations from the
                            community
                        </p>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-gray-800 rounded-xl p-4 mb-8 border border-gray-700">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search models..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="w-full px-4 py-3 pl-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                    <svg
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                            </form>

                            {/* Filter */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "all"
                                            ? "bg-yellow-500 text-gray-900"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter("free")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "free"
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    Free
                                </button>
                                <button
                                    onClick={() => setFilter("paid")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === "paid"
                                            ? "bg-purple-500 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    Paid
                                </button>
                            </div>

                            {/* Sort */}
                            <select
                                value={sort}
                                onChange={(e) =>
                                    setSort(e.target.value as SortOption)
                                }
                                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="price_low">
                                    Price: Low to High
                                </option>
                                <option value="price_high">
                                    Price: High to Low
                                </option>
                                <option value="name">Name A-Z</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6 text-gray-400">
                        {isLoading
                            ? "Loading..."
                            : `${filteredModels.length} model${filteredModels.length !== 1 ? "s" : ""} found`}
                    </div>

                    {/* Models Grid */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        </div>
                    ) : filteredModels.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredModels.map((model) => (
                                <Link
                                    key={model.id}
                                    href={mocUrl(model)}
                                    className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
                                >
                                    <div className="aspect-video bg-gray-700 relative overflow-hidden">
                                        {model.thumbnail ? (
                                            <img
                                                src={`${model.thumbnail}`}
                                                alt={model.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                                <svg
                                                    className="w-16 h-16 text-gray-600"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                        )}
                                        {model.price === null ||
                                        model.price === 0 ? (
                                            <span className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg">
                                                FREE
                                            </span>
                                        ) : (
                                            <span className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-sm font-bold rounded-full shadow-lg">
                                                $
                                                {Number(
                                                    model.price ?? 0,
                                                ).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors truncate">
                                            {model.name}
                                        </h3>
                                        {model.description && (
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                                {model.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                    </svg>
                                                    {model.total_parts}
                                                </span>
                                                <span className="flex items-center gap-1">
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
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                        />
                                                    </svg>
                                                    {model.total_steps} steps
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                                            <span className="text-gray-500 text-sm">
                                                by{" "}
                                                {model.user?.name ||
                                                    "Anonymous"}
                                            </span>
                                            {/* Quick Add to Cart for paid models */}
                                            {model.price &&
                                                model.price > 0 &&
                                                model.id &&
                                                (isInCart(model.id) ? (
                                                    <span className="text-yellow-400 text-xs font-medium flex items-center gap-1">
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                        In Cart
                                                    </span>
                                                ) : (
                                                    user?.id !==
                                                        model.user_id && (
                                                        <button
                                                            onClick={(e) =>
                                                                handleAddToCart(
                                                                    e,
                                                                    model.id!,
                                                                )
                                                            }
                                                            disabled={
                                                                addingToCartId ===
                                                                model.id
                                                            }
                                                            className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors disabled:opacity-50"
                                                            title="Add to Cart"
                                                        >
                                                            {addingToCartId ===
                                                            model.id ? (
                                                                <svg
                                                                    className="w-4 h-4 animate-spin"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    )
                                                ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <svg
                                className="w-16 h-16 text-gray-600 mx-auto mb-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                No models found
                            </h3>
                            <p className="text-gray-500">
                                {search
                                    ? "Try adjusting your search or filters"
                                    : "Be the first to share a model!"}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <Footer />
        </div>
    );
}
