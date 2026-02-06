import type { FlipStatsData } from "../../Pages/Flipping";

interface FlipStatsProps {
    stats: FlipStatsData;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCurrencyPrecise(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

export default function FlipStats({ stats }: FlipStatsProps) {
    const profitColor =
        stats.total_profit > 0
            ? "text-emerald-400"
            : stats.total_profit < 0
              ? "text-red-400"
              : "text-gray-400";

    const marginColor =
        stats.avg_margin > 0
            ? "text-emerald-400"
            : stats.avg_margin < 0
              ? "text-red-400"
              : "text-gray-400";

    const cards = [
        {
            label: "Total Spent",
            value: formatCurrency(stats.total_buy_amount),
            sub: `${stats.total_buys} buys`,
            icon: (
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Revenue",
            value: formatCurrency(stats.total_sell_amount),
            sub: `${stats.total_sells} sales`,
            icon: (
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Profit",
            value: formatCurrencyPrecise(stats.total_profit),
            sub: `${stats.avg_margin > 0 ? "+" : ""}${stats.avg_margin}% margin`,
            icon: (
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
            ),
            color: profitColor,
            bg: stats.total_profit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
        },
        {
            label: "Inventory Value",
            value: formatCurrency(stats.inventory_value),
            sub: `${stats.open_buys} unmatched buys`,
            icon: (
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            ),
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">
                            {card.label}
                        </span>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <span className={card.color}>{card.icon}</span>
                        </div>
                    </div>
                    <div className={`text-2xl font-bold ${card.color} mb-1`}>
                        {card.value}
                    </div>
                    <div
                        className={`text-sm ${marginColor === card.color && card.label === "Profit" ? marginColor : "text-gray-500"}`}
                    >
                        {card.sub}
                    </div>
                </div>
            ))}
        </div>
    );
}
