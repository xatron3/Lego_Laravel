import React, { useState, useEffect } from "react";
import { api } from "../api";

interface SellerAnalytics {
    summary: {
        total_earnings: number;
        pending_earnings: number;
        paid_earnings: number;
        total_sales: number;
    };
    top_mocs: Array<{
        moc_id: number;
        moc_name: string;
        moc_thumbnail?: string;
        moc_price: number;
        sales_count: number;
        revenue: number;
    }>;
    recent_sales: Array<{
        id: number;
        moc_name: string;
        moc_thumbnail?: string;
        buyer_name: string;
        amount: string;
        date: string;
    }>;
    sales_chart: Array<{
        date: string;
        count: number;
        revenue: string;
    }>;
}

export default function SalesAnalytics() {
    const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getSellerAnalytics();
            setAnalytics(data);
        } catch (err) {
            setError("Failed to load analytics");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                <p className="text-red-500">
                    {error || "Failed to load analytics"}
                </p>
                <button
                    onClick={loadAnalytics}
                    className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    Sales & Earnings
                </h1>
                <button
                    onClick={loadAnalytics}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                >
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-400">
                            Total Earnings
                        </h3>
                        <svg
                            className="w-6 h-6 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        ${analytics.summary.total_earnings.toFixed(2)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-yellow-400">
                            Pending
                        </h3>
                        <svg
                            className="w-6 h-6 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        ${analytics.summary.pending_earnings.toFixed(2)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-400">
                            Paid Out
                        </h3>
                        <svg
                            className="w-6 h-6 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        ${analytics.summary.paid_earnings.toFixed(2)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-purple-400">
                            Total Sales
                        </h3>
                        <svg
                            className="w-6 h-6 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {analytics.summary.total_sales}
                    </p>
                </div>
            </div>

            {/* Top Models & Recent Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Models */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Top Selling MOCs
                    </h2>
                    {analytics.top_mocs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No sales yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.top_mocs.map((moc) => (
                                <div
                                    key={moc.moc_id}
                                    className="flex items-center gap-4 bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden">
                                        {moc.moc_thumbnail ? (
                                            <img
                                                src={moc.moc_thumbnail}
                                                alt={moc.moc_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg
                                                    className="w-8 h-8 text-gray-500"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">
                                            {moc.moc_name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                            <span>{moc.sales_count} sales</span>
                                            <span>•</span>
                                            <span className="text-green-400 font-medium">
                                                ${moc.revenue.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Recent Sales
                    </h2>
                    {analytics.recent_sales.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No sales yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.recent_sales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center gap-4 bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden">
                                        {sale.moc_thumbnail ? (
                                            <img
                                                src={sale.moc_thumbnail}
                                                alt={sale.moc_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg
                                                    className="w-6 h-6 text-gray-500"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white text-sm font-medium truncate">
                                            {sale.moc_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <span>by {sale.buyer_name}</span>
                                            <span>•</span>
                                            <span>
                                                {new Date(
                                                    sale.date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-green-400 font-medium text-sm">
                                        ${Number(sale.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sales Chart Placeholder */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-green-500"
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
                    Sales Over Time (Last 30 Days)
                </h2>
                {analytics.sales_chart.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">
                        No sales data available
                    </p>
                ) : (
                    <div className="py-8">
                        {/* Simple bar chart visualization */}
                        <div className="space-y-2">
                            {analytics.sales_chart.map((day, index) => {
                                const maxRevenue = Math.max(
                                    ...analytics.sales_chart.map((d) =>
                                        Number(d.revenue),
                                    ),
                                );
                                const percentage =
                                    maxRevenue > 0
                                        ? (Number(day.revenue) / maxRevenue) *
                                          100
                                        : 0;

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-24 text-xs text-gray-400 text-right">
                                            {new Date(
                                                day.date,
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                        <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-300 flex items-center justify-end px-3"
                                                style={{
                                                    width: `${Math.max(percentage, 5)}%`,
                                                }}
                                            >
                                                {Number(day.revenue) > 0 && (
                                                    <span className="text-xs font-medium text-white">
                                                        $
                                                        {Number(
                                                            day.revenue,
                                                        ).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-16 text-xs text-gray-400">
                                            {day.count}{" "}
                                            {day.count === 1 ? "sale" : "sales"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
