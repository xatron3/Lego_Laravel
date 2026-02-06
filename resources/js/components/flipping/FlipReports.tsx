import type { FlipStatsData } from "../../Pages/Flipping";

interface SetPerformance {
    set_num: string;
    set_name: string;
    total_flips: number;
    total_profit: number;
    avg_margin: number;
    total_sold: number;
}

interface PlatformStats {
    platform: string;
    buy_count: number;
    sell_count: number;
    total_buy_amount: number;
    total_sell_amount: number;
    profit: number;
}

interface FlipReportsProps {
    stats: FlipStatsData;
    topSets?: SetPerformance[];
    platformStats?: PlatformStats[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default function FlipReports({
    stats,
    topSets = [],
    platformStats = [],
}: FlipReportsProps) {
    // Group monthly trend data by month
    const monthlyTrendMap = new Map<string, { buys: number; sells: number }>();
    stats.monthly_trend?.forEach((item) => {
        if (!monthlyTrendMap.has(item.month)) {
            monthlyTrendMap.set(item.month, { buys: 0, sells: 0 });
        }
        const data = monthlyTrendMap.get(item.month)!;
        if (item.type === "buy") {
            data.buys = item.count;
        } else {
            data.sells = item.count;
        }
    });

    const monthlyActivity = Array.from(monthlyTrendMap.entries())
        .map(([month, data]) => ({
            month,
            buys: data.buys,
            sells: data.sells,
        }))
        .slice(-6); // Last 6 months

    return (
        <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average Flip Time */}
                <div className="bg-linear-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            Win Rate
                        </h3>
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <svg
                                className="w-6 h-6 text-purple-400"
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
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                        {stats.complete_count > 0
                            ? Math.round(
                                  (stats.complete_count /
                                      (stats.total_buys + stats.total_sells)) *
                                      100,
                              )
                            : 0}
                        %
                    </div>
                    <p className="text-sm text-gray-400">
                        {stats.complete_count} completed flips
                    </p>
                </div>

                {/* Average Profit per Flip */}
                <div className="bg-linear-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            Avg Profit/Flip
                        </h3>
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <svg
                                className="w-6 h-6 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                        {formatCurrency(
                            stats.completed_matches > 0
                                ? stats.total_profit / stats.completed_matches
                                : 0,
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        From {stats.completed_matches} completed flips
                    </p>
                </div>

                {/* Active Inventory */}
                <div className="bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            Active Inventory
                        </h3>
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <svg
                                className="w-6 h-6 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                        {stats.open_buys}
                    </div>
                    <p className="text-sm text-gray-400">
                        {formatCurrency(stats.inventory_value)} value
                    </p>
                </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                    Monthly Activity (Last 6 Months)
                </h3>
                {monthlyActivity.length > 0 ? (
                    <div className="space-y-4">
                        {monthlyActivity.map((item) => {
                            const maxActivity = Math.max(
                                ...monthlyActivity.flatMap((d) => [
                                    d.buys,
                                    d.sells,
                                ]),
                            );
                            return (
                                <div key={item.month}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-400">
                                            {new Date(
                                                item.month + "-01",
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-blue-400">
                                                {item.buys} buys
                                            </span>
                                            <span className="text-emerald-400">
                                                {item.sells} sells
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 h-8">
                                        <div
                                            className="bg-blue-500/30 border border-blue-500/50 rounded flex items-center justify-center text-xs text-blue-300 font-medium"
                                            style={{
                                                width: `${(item.buys / maxActivity) * 100}%`,
                                                minWidth:
                                                    item.buys > 0 ? "3%" : "0%",
                                            }}
                                        >
                                            {item.buys > 0 && item.buys}
                                        </div>
                                        <div
                                            className="bg-emerald-500/30 border border-emerald-500/50 rounded flex items-center justify-center text-xs text-emerald-300 font-medium"
                                            style={{
                                                width: `${(item.sells / maxActivity) * 100}%`,
                                                minWidth:
                                                    item.sells > 0
                                                        ? "3%"
                                                        : "0%",
                                            }}
                                        >
                                            {item.sells > 0 && item.sells}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        No activity data available
                    </div>
                )}
            </div>

            {/* Top Performing Sets & Platform Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Sets */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">
                        Top Performing Sets
                    </h3>
                    {topSets.length > 0 ? (
                        <div className="space-y-4">
                            {topSets.slice(0, 5).map((set, idx) => (
                                <div
                                    key={set.set_num}
                                    className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg border border-gray-700"
                                >
                                    <div className="shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-400 font-bold text-sm">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">
                                            {set.set_name || set.set_num}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {set.total_flips} flip
                                            {set.total_flips !== 1
                                                ? "s"
                                                : ""} •{" "}
                                            {set.avg_margin.toFixed(1)}% margin
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-bold">
                                            {formatCurrency(set.total_profit)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No set data available yet
                        </div>
                    )}
                </div>

                {/* Platform Performance */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">
                        Platform Performance
                    </h3>
                    {platformStats.length > 0 ? (
                        <div className="space-y-4">
                            {platformStats.map((platform) => (
                                <div
                                    key={platform.platform}
                                    className="p-4 bg-gray-700/30 rounded-lg border border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white font-semibold">
                                            {platform.platform}
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                platform.profit > 0
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {formatCurrency(platform.profit)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-gray-400">
                                                Buys
                                            </div>
                                            <div className="text-blue-400 font-medium">
                                                {platform.buy_count} •{" "}
                                                {formatCurrency(
                                                    platform.total_buy_amount,
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">
                                                Sells
                                            </div>
                                            <div className="text-emerald-400 font-medium">
                                                {platform.sell_count} •{" "}
                                                {formatCurrency(
                                                    platform.total_sell_amount,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No platform data available yet
                        </div>
                    )}
                </div>
            </div>

            {/* Profit Distribution */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                    Performance Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">
                            {stats.avg_margin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">
                            Average Margin
                        </div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                            {stats.total_buys}
                        </div>
                        <div className="text-sm text-gray-400">Total Buys</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400 mb-1">
                            {stats.total_sells}
                        </div>
                        <div className="text-sm text-gray-400">Total Sells</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                            {formatCurrency(
                                stats.total_buy_amount +
                                    stats.total_sell_amount,
                            )}
                        </div>
                        <div className="text-sm text-gray-400">
                            Total Volume
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
