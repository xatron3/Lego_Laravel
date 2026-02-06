import { useState, useCallback } from "react";
import FlipItemSearch from "./FlipItemSearch";
import { getCsrfToken, ensureCsrfCookie } from "../../api";

interface TransactionItemForm {
    id?: number;
    item_type: "set" | "minifig" | "custom";
    set_num: string | null;
    fig_num: string | null;
    custom_description: string | null;
    quantity: number;
    estimated_value: number | null;
    condition: string | null;
    label?: string;
}

interface FlipTransactionFormProps {
    type: "buy" | "sell";
    initialData?: {
        id?: number;
        title: string;
        notes: string | null;
        platform: string | null;
        transaction_date: string;
        shipping_cost: string;
        fees: string;
        items: TransactionItemForm[];
    };
    onClose: () => void;
    onSuccess: () => void;
}

const PLATFORMS = [
    "BrickLink",
    "eBay",
    "Facebook Marketplace",
    "Craigslist",
    "LEGO Store",
    "Garage Sale",
    "Thrift Store",
    "Local",
    "Other",
];

const CONDITIONS = [
    "New/Sealed",
    "New/Open Box",
    "Used - Like New",
    "Used - Good",
    "Used - Fair",
];

export default function FlipTransactionForm({
    type,
    initialData,
    onClose,
    onSuccess,
}: FlipTransactionFormProps) {
    const isEditing = !!initialData?.id;

    const [title, setTitle] = useState(initialData?.title || "");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [platform, setPlatform] = useState(initialData?.platform || "");
    const [transactionDate, setTransactionDate] = useState(
        initialData?.transaction_date
            ? initialData.transaction_date.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
    );
    const [shippingCost, setShippingCost] = useState(
        initialData?.shipping_cost || "0",
    );
    const [fees, setFees] = useState(initialData?.fees || "0");
    const [items, setItems] = useState<TransactionItemForm[]>(
        initialData?.items || [],
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate price from items
    const itemsTotal = items.reduce(
        (sum, item) => sum + (item.estimated_value || 0) * item.quantity,
        0,
    );
    const calculatedPrice =
        itemsTotal + parseFloat(shippingCost || "0") + parseFloat(fees || "0");

    const handleAddItem = useCallback(
        (
            itemType: "set" | "minifig" | "custom",
            identifier?: string,
            label?: string,
        ) => {
            const newItem: TransactionItemForm = {
                item_type: itemType,
                set_num: itemType === "set" ? identifier || null : null,
                fig_num: itemType === "minifig" ? identifier || null : null,
                custom_description: itemType === "custom" ? label || "" : null,
                quantity: 1,
                estimated_value: null,
                condition: null,
                label,
            };
            setItems((prev) => [...prev, newItem]);
        },
        [],
    );

    const handleUpdateItem = useCallback(
        (index: number, updates: Partial<TransactionItemForm>) => {
            setItems((prev) =>
                prev.map((item, i) =>
                    i === index ? { ...item, ...updates } : item,
                ),
            );
        },
        [],
    );

    const handleRemoveItem = useCallback((index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate at least one item
        if (items.length === 0) {
            setError("Please add at least one item to the transaction");
            return;
        }

        // Validate all items have estimated value
        const missingValues = items.some(
            (item) => !item.estimated_value || item.estimated_value <= 0,
        );
        if (missingValues) {
            setError("All items must have an estimated value greater than 0");
            return;
        }

        setIsSubmitting(true);

        try {
            // Ensure CSRF cookie is set
            await ensureCsrfCookie();

            const payload = {
                type,
                title,
                price: calculatedPrice,
                notes: notes || null,
                platform: platform || null,
                transaction_date: transactionDate,
                shipping_cost: parseFloat(shippingCost) || 0,
                fees: parseFloat(fees) || 0,
                items: items.map((item) => ({
                    ...(item.id ? { id: item.id } : {}),
                    item_type: item.item_type,
                    set_num: item.set_num,
                    fig_num: item.fig_num,
                    custom_description: item.custom_description,
                    quantity: item.quantity,
                    estimated_value: item.estimated_value,
                    condition: item.condition,
                })),
            };

            const url = isEditing
                ? `/api/flipping/${initialData!.id}`
                : "/api/flipping";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to save transaction");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isEditing ? "Edit" : "Log"}{" "}
                            {type === "buy" ? "Purchase" : "Sale"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {type === "buy"
                                ? "Record a LEGO purchase you made"
                                : "Record a LEGO sale you completed"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={
                                type === "buy"
                                    ? 'e.g. "UCS Millennium Falcon from eBay"'
                                    : 'e.g. "Sold Star Destroyer lot"'
                            }
                            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Transaction Date{" "}
                            <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Shipping + Fees + Platform row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Shipping
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={shippingCost}
                                    onChange={(e) =>
                                        setShippingCost(e.target.value)
                                    }
                                    className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Fees/Tax
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={fees}
                                    onChange={(e) => setFees(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Platform
                            </label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                            >
                                <option value="">Select platform...</option>
                                {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Total display */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                            Total (Items + Shipping + Fees)
                        </span>
                        <span
                            className={`text-lg font-bold ${type === "buy" ? "text-blue-400" : "text-emerald-400"}`}
                        >
                            ${calculatedPrice.toFixed(2)}
                        </span>
                    </div>

                    {/* Items Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Items
                            <span className="text-red-400 font-normal ml-1">
                                (required - at least 1)
                            </span>
                        </label>

                        {/* Item list */}
                        {items.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-start gap-3"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                                        item.item_type === "set"
                                                            ? "bg-blue-900/40 text-blue-400"
                                                            : item.item_type ===
                                                                "minifig"
                                                              ? "bg-purple-900/40 text-purple-400"
                                                              : "bg-gray-700 text-gray-400"
                                                    }`}
                                                >
                                                    {item.item_type === "set"
                                                        ? "Set"
                                                        : item.item_type ===
                                                            "minifig"
                                                          ? "Minifig"
                                                          : "Custom"}
                                                </span>
                                                <span className="text-white text-sm font-medium">
                                                    {item.label ||
                                                        item.set_num ||
                                                        item.fig_num ||
                                                        item.custom_description ||
                                                        "Item"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {item.item_type ===
                                                    "custom" && (
                                                    <input
                                                        type="text"
                                                        value={
                                                            item.custom_description ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateItem(
                                                                index,
                                                                {
                                                                    custom_description:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="Description"
                                                        className="flex-1 min-w-40 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
                                                    />
                                                )}
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleUpdateItem(
                                                            index,
                                                            {
                                                                quantity:
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                            },
                                                        )
                                                    }
                                                    className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white text-center"
                                                    title="Quantity"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                                        $
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            item.estimated_value ??
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateItem(
                                                                index,
                                                                {
                                                                    estimated_value:
                                                                        e.target
                                                                            .value
                                                                            ? parseFloat(
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                              )
                                                                            : null,
                                                                },
                                                            )
                                                        }
                                                        placeholder="Value"
                                                        className="w-24 pl-5 pr-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
                                                        title="Estimated value"
                                                    />
                                                </div>
                                                <select
                                                    value={item.condition || ""}
                                                    onChange={(e) =>
                                                        handleUpdateItem(
                                                            index,
                                                            {
                                                                condition:
                                                                    e.target
                                                                        .value ||
                                                                    null,
                                                            },
                                                        )
                                                    }
                                                    className="px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
                                                >
                                                    <option value="">
                                                        Condition
                                                    </option>
                                                    {CONDITIONS.map((c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                        >
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveItem(index)
                                            }
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
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add item controls */}
                        <FlipItemSearch onSelect={handleAddItem} />

                        <button
                            type="button"
                            onClick={() =>
                                handleAddItem("custom", undefined, "")
                            }
                            className="mt-2 w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm flex items-center justify-center gap-1"
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
                            Add Custom Item
                        </button>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes about this transaction..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isSubmitting || !title || items.length === 0
                            }
                            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                                type === "buy"
                                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                  ? "Update"
                                  : type === "buy"
                                    ? "Log Purchase"
                                    : "Log Sale"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
