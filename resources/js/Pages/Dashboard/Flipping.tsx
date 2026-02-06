import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import FlipStats from "../../components/flipping/FlipStats";
import FlipTransactionList from "../../components/flipping/FlipTransactionList";
import FlipTransactionForm from "../../components/flipping/FlipTransactionForm";
import FlipFilters from "../../components/flipping/FlipFilters";
import FlipReports from "../../components/flipping/FlipReports";
import DashboardLayout from "../../components/DashboardLayout";
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

interface DashboardFlippingProps {
    stats: FlipStatsData;
    transactions: PaginatedData<FlipTransactionData>;
    platforms: string[];
    filters: Record<string, string | undefined>;
    topSets?: SetPerformance[];
    platformAnalytics?: PlatformStat[];
}

export default function DashboardFlipping({
    stats,
    transactions,
    platforms,
    filters,
    topSets = [],
    platformAnalytics = [],
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
