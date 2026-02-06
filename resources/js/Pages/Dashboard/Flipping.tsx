import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import FlipStats from "../../components/flipping/FlipStats";
import FlipTransactionList from "../../components/flipping/FlipTransactionList";
import FlipTransactionForm from "../../components/flipping/FlipTransactionForm";
import FlipFilters from "../../components/flipping/FlipFilters";
import FlipReports from "../../components/flipping/FlipReports";
import DashboardLayout from "../../components/DashboardLayout";
import ProUpgradePrompt from "../../components/ProUpgradePrompt";
import type { FlipStatsData, FlipTransactionData } from "../Flipping";

type TabType = "overview" | "reports";

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface SetPerformance {
    set_num: string;
    set_name: string;
    total_flips: number;
    total_profit: number;
    avg_margin: number;
    total_sold: number;
}

interface PlatformStat {
    platform: string;
    buy_count: number;
    sell_count: number;
    total_buy_amount: number;
    total_sell_amount: number;
    profit: number;
}

interface FlipLimits {
    is_pro: boolean;
    remaining: number | null;
    limit: number | null;
}

interface DashboardFlippingProps {
    stats: FlipStatsData;
    transactions: PaginatedData<FlipTransactionData>;
    platforms: string[];
    filters: Record<string, string | undefined>;
    topSets?: SetPerformance[];
    platformAnalytics?: PlatformStat[];
    flipLimits?: FlipLimits;
}

export default function DashboardFlipping({
    stats,
    transactions,
    platforms,
    filters,
    topSets = [],
    platformAnalytics = [],
    flipLimits,
}: DashboardFlippingProps) {
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createType, setCreateType] = useState<"buy" | "sell">("buy");

    const handleFilterChange = useCallback(
        (newFilters: Record<string, string | undefined>) => {
            router.get(
                "/dashboard/flipping",
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

    const limitReached =
        flipLimits &&
        !flipLimits.is_pro &&
        flipLimits.remaining !== null &&
        flipLimits.remaining <= 0;

    return (
        <DashboardLayout currentPage="flipping">
            <div>
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
                            disabled={!!limitReached}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            disabled={!!limitReached}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Flip Transaction Limit Warning */}
                {flipLimits &&
                    !flipLimits.is_pro &&
                    flipLimits.remaining !== null && (
                        <div className="mb-6">
                            {flipLimits.remaining <= 0 ? (
                                <ProUpgradePrompt
                                    feature="Flip Transaction Limit Reached"
                                    description={`You've used all ${flipLimits.limit} free flip transactions. Upgrade to Pro for unlimited tracking.`}
                                    compact
                                />
                            ) : flipLimits.remaining <= 20 ? (
                                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <svg
                                        className="w-5 h-5 text-yellow-400 shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                        />
                                    </svg>
                                    <p className="text-yellow-300 text-sm">
                                        <span className="font-semibold">
                                            {flipLimits.remaining}
                                        </span>{" "}
                                        of {flipLimits.limit} free flip
                                        transactions remaining.{" "}
                                        <a
                                            href="/pro"
                                            className="text-yellow-400 hover:text-yellow-300 underline font-medium"
                                        >
                                            Upgrade to Pro
                                        </a>{" "}
                                        for unlimited tracking.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-3 font-medium transition-all relative ${
                            activeTab === "overview"
                                ? "text-yellow-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Overview
                        {activeTab === "overview" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`px-6 py-3 font-medium transition-all relative ${
                            activeTab === "reports"
                                ? "text-yellow-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <div className="flex items-center gap-2">
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
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Reports
                        </div>
                        {activeTab === "reports" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" ? (
                    <div>
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
                    </div>
                ) : (
                    <FlipReports
                        stats={stats}
                        topSets={topSets}
                        platformStats={platformAnalytics}
                    />
                )}
            </div>

            {/* Create Transaction Modal */}
            {showCreateForm && (
                <FlipTransactionForm
                    type={createType}
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </DashboardLayout>
    );
}
