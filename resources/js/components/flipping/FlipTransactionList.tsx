import { Link } from "@inertiajs/react";
import type { FlipTransactionData } from "../../Pages/Flipping";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, getCurrencySettings } from "../../utils/currency";

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface FlipTransactionListProps {
    transactions: PaginatedData<FlipTransactionData>;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        partial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.open}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function TypeBadge({ type }: { type: "buy" | "sell" }) {
    return type === "buy" ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                />
            </svg>
            Buy
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"
                />
            </svg>
            Sale
        </span>
    );
}

function ItemsSummary({ items }: { items: FlipTransactionData["items"] }) {
    if (!items || items.length === 0) {
        return <span className="text-gray-500 text-sm italic">No items</span>;
    }

    const displayItems = items.slice(0, 3);
    const remaining = items.length - 3;

    return (
        <div className="flex flex-wrap gap-1.5">
            {displayItems.map((item) => {
                let label = "";
                let bgClass = "bg-gray-700";

                if (item.item_type === "set") {
                    label = item.set?.name
                        ? `${item.set_num} ${item.set.name}`
                        : item.set_num || "Set";
                    bgClass = "bg-blue-900/40";
                } else if (item.item_type === "minifig") {
                    label = item.minifig?.name || item.fig_num || "Minifig";
                    bgClass = "bg-purple-900/40";
                } else {
                    label = item.custom_description || "Custom";
                    bgClass = "bg-gray-700";
                }

                if (label.length > 30) {
                    label = label.substring(0, 27) + "...";
                }

                return (
                    <span
                        key={item.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${bgClass} text-gray-300`}
                        title={label}
                    >
                        {item.quantity > 1 && (
                            <span className="font-medium mr-1">
                                {item.quantity}x
                            </span>
                        )}
                        {label}
                    </span>
                );
            })}
            {remaining > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                    +{remaining} more
                </span>
            )}
        </div>
    );
}

/** Shows sub-sells summary for a buy transaction */
function SubSellsSummary({
    transaction,
    currencySettings,
}: {
    transaction: FlipTransactionData;
    currencySettings: any;
}) {
    const subTransactions = transaction.sub_transactions || [];

    if (transaction.type !== "buy" || subTransactions.length === 0) return null;

    const totalRevenue = subTransactions.reduce(
        (sum, sub) => sum + parseFloat(sub.price),
        0,
    );

    return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <svg
                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"
                />
            </svg>
            <span className="text-xs text-emerald-400">
                {subTransactions.length} sale
                {subTransactions.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-500">
                (
                {formatCurrency(totalRevenue, currencySettings, {
                    precise: true,
                })}{" "}
                revenue)
            </span>
        </div>
    );
}

export default function FlipTransactionList({
    transactions,
}: FlipTransactionListProps) {
    const { user } = useAuth();
    const currencySettings = getCurrencySettings(user);

    if (transactions.total === 0) {
        return (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
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
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">
                    No transactions yet
                </h3>
                <p className="text-gray-400">
                    Log your first buy to start tracking your flips!
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Desktop table */}
            <div className="hidden md:block bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                Date
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                Type
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                Title
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                Items
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                                Cost
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                                Revenue
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                Status
                            </th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {transactions.data.map((t) => {
                            const subTransactions = t.sub_transactions || [];
                            const revenue = subTransactions.reduce(
                                (sum, sub) => sum + parseFloat(sub.price),
                                0,
                            );
                            const cost =
                                parseFloat(t.price) +
                                parseFloat(t.shipping_cost || "0") +
                                parseFloat(t.fees || "0");

                            return (
                                <tr
                                    key={t.id}
                                    className="hover:bg-gray-700/30 transition-colors group"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                                        {formatDate(t.transaction_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TypeBadge type={t.type} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/dashboard/flipping/${t.id}`}
                                            className="text-white font-medium hover:text-yellow-400 transition-colors"
                                        >
                                            {t.title}
                                        </Link>
                                        <SubSellsSummary
                                            transaction={t}
                                            currencySettings={currencySettings}
                                        />
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                        <ItemsSummary items={t.items} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-semibold text-blue-400">
                                            {formatCurrency(
                                                cost,
                                                currencySettings,
                                                { precise: true },
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {revenue > 0 ? (
                                            <span className="font-semibold text-emerald-400">
                                                {formatCurrency(
                                                    revenue,
                                                    currencySettings,
                                                    { precise: true },
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={t.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/dashboard/flipping/${t.id}`}
                                            className="text-gray-500 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all"
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
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {transactions.data.map((t) => {
                    const subTransactions = t.sub_transactions || [];
                    const revenue = subTransactions.reduce(
                        (sum, sub) => sum + parseFloat(sub.price),
                        0,
                    );
                    const cost =
                        parseFloat(t.price) +
                        parseFloat(t.shipping_cost || "0") +
                        parseFloat(t.fees || "0");

                    return (
                        <Link
                            key={t.id}
                            href={`/dashboard/flipping/${t.id}`}
                            className="block bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TypeBadge type={t.type} />
                                    <StatusBadge status={t.status} />
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-blue-400">
                                        {formatCurrency(
                                            cost,
                                            currencySettings,
                                            { precise: true },
                                        )}
                                    </span>
                                    {revenue > 0 && (
                                        <div className="text-sm text-emerald-400">
                                            →{" "}
                                            {formatCurrency(
                                                revenue,
                                                currencySettings,
                                                { precise: true },
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-white font-medium mb-1">
                                {t.title}
                            </h3>
                            <SubSellsSummary
                                transaction={t}
                                currencySettings={currencySettings}
                            />
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-500">
                                    {formatDate(t.transaction_date)}
                                </span>
                                {t.platform && (
                                    <span className="text-gray-500">
                                        {t.platform}
                                    </span>
                                )}
                            </div>
                            {t.items.length > 0 && (
                                <div className="mt-2">
                                    <ItemsSummary items={t.items} />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Pagination */}
            {transactions.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Showing{" "}
                        {(transactions.current_page - 1) *
                            transactions.per_page +
                            1}{" "}
                        to{" "}
                        {Math.min(
                            transactions.current_page * transactions.per_page,
                            transactions.total,
                        )}{" "}
                        of {transactions.total} transactions
                    </p>
                    <div className="flex gap-1">
                        {transactions.links.map((link, i) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 text-sm text-gray-600 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                        link.active
                                            ? "bg-yellow-500 text-gray-900 font-semibold"
                                            : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    preserveScroll
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
