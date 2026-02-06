import { useState } from "react";
import { router, Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import { getCsrfToken, ensureCsrfCookie } from "../api";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import type { FlipTransactionData, FlipTransactionItem } from "./Flipping";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FlipNoteData {
    id: number;
    flip_transaction_id: number;
    content: string;
    created_at: string;
}

interface FlippingDetailProps {
    transaction: FlipTransactionData & {
        parent_id?: number | null;
        sub_transactions?: FlipTransactionData[];
        transaction_notes?: FlipNoteData[];
        parent?: FlipTransactionData;
    };
    totalCost: number;
    subSellTotal: number;
    subShippingTotal: number;
    subFeesTotal: number;
    subProfit: number | null;
    hasOnlyTrackableItems: boolean;
    hasCustomItems: boolean;
}

function formatCurrency(value: string | number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(typeof value === "string" ? parseFloat(value) : value);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateStr);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function FlippingDetail({
    transaction,
    totalCost,
    subSellTotal,
    subShippingTotal,
    subFeesTotal,
    subProfit,
    hasOnlyTrackableItems,
    hasCustomItems,
}: FlippingDetailProps) {
    useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // Add sale form state
    const [showAddSaleForm, setShowAddSaleForm] = useState(false);
    const [saleForm, setSaleForm] = useState({
        title: "",
        price: "",
        platform: transaction.platform || "",
        transaction_date: new Date().toISOString().split("T")[0],
        shipping_cost: "0",
        fees: "0",
        notes: "",
    });
    const [saleItems, setSaleItems] = useState<
        Array<{
            item_type: "set" | "minifig" | "custom";
            set_num?: string;
            fig_num?: string;
            custom_description?: string;
            quantity: number;
            estimated_value?: string;
        }>
    >([]);
    const [isSubmittingSale, setIsSubmittingSale] = useState(false);

    // Notes state
    const [newNote, setNewNote] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

    const isBuy = transaction.type === "buy";
    const isSubSell =
        transaction.parent_id !== null && transaction.parent_id !== undefined;
    const subTransactions = transaction.sub_transactions || [];

    /* ------------------------------------------------------------------ */
    /*  API helpers                                                        */
    /* ------------------------------------------------------------------ */

    async function apiCall(
        url: string,
        method: "POST" | "DELETE" = "POST",
        body?: unknown,
    ) {
        await ensureCsrfCookie();
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "include",
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Request failed: ${res.status}`);
        }
        return res.json();
    }

    /* ------------------------------------------------------------------ */
    /*  Actions                                                            */
    /* ------------------------------------------------------------------ */

    async function handleDelete() {
        if (!confirm("Delete this transaction? This cannot be undone.")) return;
        setIsDeleting(true);
        try {
            await apiCall(`/api/flipping/${transaction.id}`, "DELETE");
            router.visit("/dashboard/flipping");
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete");
            setIsDeleting(false);
        }
    }

    async function handleToggleStatus() {
        setIsTogglingStatus(true);
        try {
            const endpoint =
                transaction.status === "complete"
                    ? `/api/flipping/${transaction.id}/reopen`
                    : `/api/flipping/${transaction.id}/complete`;
            await apiCall(endpoint, "POST");
            router.reload();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to update status");
        } finally {
            setIsTogglingStatus(false);
        }
    }

    async function handleAddNote() {
        if (!newNote.trim()) return;
        setIsAddingNote(true);
        try {
            await apiCall(`/api/flipping/${transaction.id}/notes`, "POST", {
                content: newNote.trim(),
            });
            setNewNote("");
            router.reload();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to add note");
        } finally {
            setIsAddingNote(false);
        }
    }

    async function handleDeleteNote(noteId: number) {
        if (!confirm("Delete this note?")) return;
        try {
            await apiCall(
                `/api/flipping/${transaction.id}/notes/${noteId}`,
                "DELETE",
            );
            router.reload();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete note");
        }
    }

    async function handleAddSale() {
        if (!saleForm.title || !saleForm.price) {
            alert("Please enter a title and price");
            return;
        }
        setIsSubmittingSale(true);
        try {
            await apiCall(`/api/flipping/${transaction.id}/sub-sell`, "POST", {
                title: saleForm.title,
                price: parseFloat(saleForm.price),
                platform: saleForm.platform || null,
                transaction_date: saleForm.transaction_date,
                shipping_cost: parseFloat(saleForm.shipping_cost) || 0,
                fees: parseFloat(saleForm.fees) || 0,
                notes: saleForm.notes || null,
                items: saleItems.length > 0 ? saleItems : undefined,
            });
            setShowAddSaleForm(false);
            setSaleForm({
                title: "",
                price: "",
                platform: transaction.platform || "",
                transaction_date: new Date().toISOString().split("T")[0],
                shipping_cost: "0",
                fees: "0",
                notes: "",
            });
            setSaleItems([]);
            router.reload();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to add sale");
        } finally {
            setIsSubmittingSale(false);
        }
    }

    async function handleDeleteSubSell(subSellId: number) {
        if (!confirm("Delete this sale? This cannot be undone.")) return;
        try {
            await apiCall(`/api/flipping/${subSellId}`, "DELETE");
            router.reload();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete sale");
        }
    }

    function addSaleItem() {
        setSaleItems([
            ...saleItems,
            { item_type: "custom", custom_description: "", quantity: 1 },
        ]);
    }

    function removeSaleItem(index: number) {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    }

    function updateSaleItem(
        index: number,
        updates: Partial<(typeof saleItems)[0]>,
    ) {
        setSaleItems(
            saleItems.map((item, i) =>
                i === index ? { ...item, ...updates } : item,
            ),
        );
    }

    // Copy items from parent buy to sale form
    function copyBuyItems() {
        const copied = transaction.items.map((item) => ({
            item_type: item.item_type,
            set_num: item.set_num || undefined,
            fig_num: item.fig_num || undefined,
            custom_description: item.custom_description || undefined,
            quantity: item.quantity,
            estimated_value: item.estimated_value?.toString(),
        }));
        setSaleItems(copied);
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    const notes = transaction.transaction_notes || [];
    const netProfit = subProfit !== null ? subProfit : null;

    return (
        <div className="min-h-screen bg-gray-900">
            <Header onOpenAuthModal={() => setShowAuthModal(true)} />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Link
                        href="/dashboard/flipping"
                        className="hover:text-white transition-colors"
                    >
                        Flipping
                    </Link>
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
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                    {isSubSell && transaction.parent && (
                        <>
                            <Link
                                href={`/dashboard/flipping/${transaction.parent.id}`}
                                className="hover:text-white transition-colors"
                            >
                                {transaction.parent.title}
                            </Link>
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </>
                    )}
                    <span className="text-white">{transaction.title}</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isBuy ? "bg-blue-500/20" : "bg-emerald-500/20"
                            }`}
                        >
                            {isBuy ? (
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
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                                    />
                                </svg>
                            ) : (
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
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"
                                    />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {transaction.title}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isBuy
                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    }`}
                                >
                                    {isBuy ? "Buy" : "Sale"}
                                </span>
                                <StatusBadge status={transaction.status} />
                                <span className="text-gray-500">
                                    {formatDate(transaction.transaction_date)}
                                </span>
                                {transaction.platform && (
                                    <span className="text-gray-500">
                                        • {transaction.platform}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Complete/Reopen button - only for parent buys */}
                        {isBuy && !isSubSell && (
                            <button
                                onClick={handleToggleStatus}
                                disabled={isTogglingStatus}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    transaction.status === "complete"
                                        ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                            >
                                {isTogglingStatus
                                    ? "..."
                                    : transaction.status === "complete"
                                      ? "Reopen"
                                      : "Mark Complete"}
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left column - Transaction details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Price summary */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                {isBuy ? "Purchase Details" : "Sale Details"}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">
                                        Price
                                    </p>
                                    <p
                                        className={`text-xl font-bold ${isBuy ? "text-blue-400" : "text-emerald-400"}`}
                                    >
                                        {formatCurrency(transaction.price)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">
                                        Shipping
                                    </p>
                                    <p className="text-xl font-bold text-gray-300">
                                        {formatCurrency(
                                            transaction.shipping_cost,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">
                                        Fees
                                    </p>
                                    <p className="text-xl font-bold text-gray-300">
                                        {formatCurrency(transaction.fees)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">
                                        Total Cost
                                    </p>
                                    <p className="text-xl font-bold text-white">
                                        {formatCurrency(totalCost)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                Items
                            </h2>
                            {transaction.items.length === 0 ? (
                                <p className="text-gray-500 italic">
                                    No items specified
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {transaction.items.map((item) => (
                                        <ItemRow key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sub-sells (for parent buys only) */}
                        {isBuy && !isSubSell && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">
                                        Sales ({subTransactions.length})
                                    </h2>
                                    <button
                                        onClick={() => setShowAddSaleForm(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
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
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        Add Sale
                                    </button>
                                </div>

                                {subTransactions.length === 0 ? (
                                    <p className="text-gray-500 italic">
                                        No sales yet. Click "Add Sale" to record
                                        a sale from this purchase.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {subTransactions.map((sub) => (
                                            <SubSellRow
                                                key={sub.id}
                                                subSell={sub}
                                                onDelete={() =>
                                                    handleDeleteSubSell(sub.id)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        {transaction.notes && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-2">
                                    Notes
                                </h2>
                                <p className="text-gray-300 whitespace-pre-wrap">
                                    {transaction.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right column - Profit summary & activity */}
                    <div className="space-y-6">
                        {/* Profit summary (for parent buys) */}
                        {isBuy && !isSubSell && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Profit Summary
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            Total Sales
                                        </span>
                                        <span className="text-emerald-400 font-semibold">
                                            {formatCurrency(subSellTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            Purchase Cost
                                        </span>
                                        <span className="text-blue-400 font-semibold">
                                            -{formatCurrency(totalCost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            Sale Fees
                                        </span>
                                        <span className="text-gray-300">
                                            -{formatCurrency(subFeesTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            Sale Shipping
                                        </span>
                                        <span className="text-gray-300">
                                            -{formatCurrency(subShippingTotal)}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-700 pt-3 mt-3">
                                        <div className="flex justify-between">
                                            <span className="text-white font-medium">
                                                Net Profit
                                            </span>
                                            <span
                                                className={`text-xl font-bold ${
                                                    netProfit === null
                                                        ? "text-gray-500"
                                                        : netProfit >= 0
                                                          ? "text-emerald-400"
                                                          : "text-red-400"
                                                }`}
                                            >
                                                {netProfit !== null
                                                    ? formatCurrency(netProfit)
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Auto-complete hint */}
                                {transaction.status !== "complete" && (
                                    <div className="mt-4 text-xs text-gray-500">
                                        {hasCustomItems ? (
                                            <p>
                                                • Contains custom items — manual
                                                completion required
                                            </p>
                                        ) : hasOnlyTrackableItems ? (
                                            <p>
                                                • Will auto-complete when all
                                                items are sold
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activity / Notes */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                Activity
                            </h2>

                            {/* Add note */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note..."
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddNote()
                                    }
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={isAddingNote || !newNote.trim()}
                                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    {isAddingNote ? "..." : "Add"}
                                </button>
                            </div>

                            {/* Notes list */}
                            {notes.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">
                                    No activity notes yet
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {notes.map((note) => (
                                        <div
                                            key={note.id}
                                            className="flex items-start justify-between gap-2 p-3 bg-gray-700/50 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-gray-300 text-sm">
                                                    {note.content}
                                                </p>
                                                <p className="text-gray-500 text-xs mt-1">
                                                    {formatTimeAgo(
                                                        note.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleDeleteNote(note.id)
                                                }
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
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
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Sale Modal */}
            {showAddSaleForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    Add Sale
                                </h2>
                                <button
                                    onClick={() => setShowAddSaleForm(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={saleForm.title}
                                        onChange={(e) =>
                                            setSaleForm({
                                                ...saleForm,
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Sold 3kg on BrickLink"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Price & Date row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Sale Price *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={saleForm.price}
                                            onChange={(e) =>
                                                setSaleForm({
                                                    ...saleForm,
                                                    price: e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={saleForm.transaction_date}
                                            onChange={(e) =>
                                                setSaleForm({
                                                    ...saleForm,
                                                    transaction_date:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Shipping & Fees */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Platform
                                        </label>
                                        <input
                                            type="text"
                                            value={saleForm.platform}
                                            onChange={(e) =>
                                                setSaleForm({
                                                    ...saleForm,
                                                    platform: e.target.value,
                                                })
                                            }
                                            placeholder="BrickLink, eBay..."
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Shipping
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={saleForm.shipping_cost}
                                            onChange={(e) =>
                                                setSaleForm({
                                                    ...saleForm,
                                                    shipping_cost:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Fees
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={saleForm.fees}
                                            onChange={(e) =>
                                                setSaleForm({
                                                    ...saleForm,
                                                    fees: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Items section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Items (optional)
                                        </label>
                                        <div className="flex gap-2">
                                            {transaction.items.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={copyBuyItems}
                                                    className="text-xs text-blue-400 hover:text-blue-300"
                                                >
                                                    Copy from buy
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={addSaleItem}
                                                className="text-xs text-emerald-400 hover:text-emerald-300"
                                            >
                                                + Add item
                                            </button>
                                        </div>
                                    </div>

                                    {saleItems.length > 0 && (
                                        <div className="space-y-2">
                                            {saleItems.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg"
                                                >
                                                    <select
                                                        value={item.item_type}
                                                        onChange={(e) =>
                                                            updateSaleItem(
                                                                idx,
                                                                {
                                                                    item_type: e
                                                                        .target
                                                                        .value as
                                                                        | "set"
                                                                        | "minifig"
                                                                        | "custom",
                                                                },
                                                            )
                                                        }
                                                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                                    >
                                                        <option value="custom">
                                                            Custom
                                                        </option>
                                                        <option value="set">
                                                            Set
                                                        </option>
                                                        <option value="minifig">
                                                            Minifig
                                                        </option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={
                                                            item.item_type ===
                                                            "set"
                                                                ? item.set_num ||
                                                                  ""
                                                                : item.item_type ===
                                                                    "minifig"
                                                                  ? item.fig_num ||
                                                                    ""
                                                                  : item.custom_description ||
                                                                    ""
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                item.item_type ===
                                                                "set"
                                                            ) {
                                                                updateSaleItem(
                                                                    idx,
                                                                    {
                                                                        set_num:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                );
                                                            } else if (
                                                                item.item_type ===
                                                                "minifig"
                                                            ) {
                                                                updateSaleItem(
                                                                    idx,
                                                                    {
                                                                        fig_num:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                );
                                                            } else {
                                                                updateSaleItem(
                                                                    idx,
                                                                    {
                                                                        custom_description:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        placeholder={
                                                            item.item_type ===
                                                            "set"
                                                                ? "Set number"
                                                                : item.item_type ===
                                                                    "minifig"
                                                                  ? "Fig number"
                                                                  : "Description"
                                                        }
                                                        className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateSaleItem(
                                                                idx,
                                                                {
                                                                    quantity:
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                },
                                                            )
                                                        }
                                                        className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm text-center"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSaleItem(idx)
                                                        }
                                                        className="text-red-400 hover:text-red-300 p-1"
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
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={saleForm.notes}
                                        onChange={(e) =>
                                            setSaleForm({
                                                ...saleForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        rows={2}
                                        placeholder="Optional notes about this sale..."
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSaleForm(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSale}
                                    disabled={
                                        isSubmittingSale ||
                                        !saleForm.title ||
                                        !saleForm.price
                                    }
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    {isSubmittingSale
                                        ? "Adding..."
                                        : "Add Sale"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

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

function ItemRow({ item }: { item: FlipTransactionItem }) {
    let label = "";
    let iconBg = "bg-gray-700";
    let icon = null;

    if (item.item_type === "set") {
        label = item.set?.name
            ? `${item.set_num} - ${item.set.name}`
            : item.set_num || "Set";
        iconBg = "bg-blue-900/40";
        icon = (
            <svg
                className="w-4 h-4 text-blue-400"
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
        );
    } else if (item.item_type === "minifig") {
        label = item.minifig?.name || item.fig_num || "Minifig";
        iconBg = "bg-purple-900/40";
        icon = (
            <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        );
    } else {
        label = item.custom_description || "Custom item";
        iconBg = "bg-gray-700";
        icon = (
            <svg
                className="w-4 h-4 text-gray-400"
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
        );
    }

    return (
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-3">
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
                >
                    {icon}
                </div>
                <div>
                    <p className="text-white font-medium">{label}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Qty: {item.quantity}</span>
                        {item.condition && <span>• {item.condition}</span>}
                    </div>
                </div>
            </div>
            {item.estimated_value && (
                <span className="text-gray-400">
                    {formatCurrency(item.estimated_value)}
                </span>
            )}
        </div>
    );
}

function SubSellRow({
    subSell,
    onDelete,
}: {
    subSell: FlipTransactionData;
    onDelete: () => void;
}) {
    const totalRevenue =
        parseFloat(subSell.price) -
        parseFloat(subSell.shipping_cost || "0") -
        parseFloat(subSell.fees || "0");

    return (
        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/flipping/${subSell.id}`}
                        className="text-white font-medium hover:text-emerald-400 transition-colors"
                    >
                        {subSell.title}
                    </Link>
                    <span className="text-xs text-gray-500">
                        {formatDate(subSell.transaction_date)}
                    </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="text-emerald-400 font-semibold">
                        {formatCurrency(subSell.price)}
                    </span>
                    {parseFloat(subSell.fees || "0") > 0 && (
                        <span>Fees: {formatCurrency(subSell.fees)}</span>
                    )}
                    {parseFloat(subSell.shipping_cost || "0") > 0 && (
                        <span>
                            Ship: {formatCurrency(subSell.shipping_cost)}
                        </span>
                    )}
                    {subSell.platform && <span>• {subSell.platform}</span>}
                </div>
                {subSell.items && subSell.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {subSell.items.slice(0, 3).map((item) => (
                            <span
                                key={item.id}
                                className="px-2 py-0.5 bg-gray-600/50 rounded text-xs text-gray-300"
                            >
                                {item.item_type === "set"
                                    ? item.set?.name || item.set_num
                                    : item.item_type === "minifig"
                                      ? item.minifig?.name || item.fig_num
                                      : item.custom_description}{" "}
                                {item.quantity > 1 && `×${item.quantity}`}
                            </span>
                        ))}
                        {subSell.items.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-600/50 rounded text-xs text-gray-400">
                                +{subSell.items.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-400">
                    Net:{" "}
                    <span className="text-white font-medium">
                        {formatCurrency(totalRevenue)}
                    </span>
                </span>
                <button
                    onClick={onDelete}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
