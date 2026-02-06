import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import FlipStats from "../components/flipping/FlipStats";
import FlipTransactionList from "../components/flipping/FlipTransactionList";
import FlipTransactionForm from "../components/flipping/FlipTransactionForm";
import FlipFilters from "../components/flipping/FlipFilters";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FlipTransactionItem {
    id: number;
    flip_transaction_id: number;
    item_type: "set" | "minifig" | "custom";
    set_num: string | null;
    fig_num: string | null;
    custom_description: string | null;
    quantity: number;
    estimated_value: number | null;
    condition: string | null;
    set?: {
        set_num: string;
        name: string;
        year?: number;
        num_parts?: number;
    } | null;
    minifig?: { fig_num: string; name: string; num_parts?: number } | null;
}

export interface FlipTransactionData {
    id: number;
    user_id: number;
    parent_id?: number | null;
    type: "buy" | "sell";
    title: string;
    price: string;
    notes: string | null;
    platform: string | null;
    transaction_date: string;
    shipping_cost: string;
    fees: string;
    status: "open" | "partial" | "complete";
    items: FlipTransactionItem[];
    sub_transactions?: FlipTransactionData[];
    created_at: string;
    updated_at: string;
}

export interface FlipStatsData {
    total_buys: number;
    total_sells: number;
    total_buy_amount: number;
    total_sell_amount: number;
    total_shipping: number;
    total_fees: number;
    total_profit: number;
    avg_margin: number;
    inventory_value: number;
    open_buys: number;
    open_sells: number;
    complete_count: number;
    completed_matches: number;
    monthly_trend: Array<{
        month: string;
        type: string;
        count: number;
        total: string;
    }>;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface FlippingProps {
    stats: FlipStatsData;
    transactions: PaginatedData<FlipTransactionData>;
    platforms: string[];
    filters: Record<string, string | undefined>;
}

export default function Flipping({
    stats,
    transactions,
    platforms,
    filters,
}: FlippingProps) {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createType, setCreateType] = useState<"buy" | "sell">("buy");

    const handleFilterChange = useCallback(
        (newFilters: Record<string, string | undefined>) => {
            router.get(
                "/flipping",
                Object.fromEntries(
                    Object.entries(newFilters).filter(
                        ([, v]) => v !== undefined && v !== "",
                    ),
                ),
                { preserveState: true, preserveScroll: true },
            );
        },
        [],
    );

    const handleCreateSuccess = useCallback(() => {
        setShowCreateForm(false);
        router.reload();
    }, []);

    const handleNewTransaction = (type: "buy" | "sell") => {
        setCreateType(type);
        setShowCreateForm(true);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Header onOpenAuthModal={() => setShowAuthModal(true)} />
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
                <div className="flex items-center justify-center pt-32">
                    <div className="text-center">
                        <svg
                            className="w-16 h-16 text-gray-600 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            LEGO Flipping Tracker
                        </h1>
                        <p className="text-gray-400 mb-6">
                            Sign in to track your LEGO buys and sells
                        </p>
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                currentPage="dashboard"
                onOpenAuthModal={() => setShowAuthModal(true)}
            />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Flipping Tracker
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Track your LEGO buys, sells, and profits
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleNewTransaction("buy")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Log Buy
                        </button>
                        <button
                            onClick={() => handleNewTransaction("sell")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Log Sale
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <FlipStats stats={stats} />

                {/* Filters */}
                <FlipFilters
                    filters={filters}
                    platforms={platforms}
                    onChange={handleFilterChange}
                />

                {/* Transaction List */}
                <FlipTransactionList transactions={transactions} />
            </main>

            {/* Create Transaction Modal */}
            {showCreateForm && (
                <FlipTransactionForm
                    type={createType}
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}
