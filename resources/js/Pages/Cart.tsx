import { useState } from "react";
import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import { api } from "../api";
import { mocUrl } from "../utils/seoUrls";

export default function Cart() {
    const { isAuthenticated } = useAuth();
    const { items, subtotal, total, isLoading, removeFromCart, clearCart } =
        useCart();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (items.length === 0) return;

        setIsCheckingOut(true);
        setCheckoutError(null);

        try {
            const { checkout_url } = await api.createCheckoutSession();
            // Redirect to Stripe Checkout
            window.location.href = checkout_url;
        } catch (error: any) {
            setCheckoutError(error.message || "Failed to start checkout");
            setIsCheckingOut(false);
        }
    };

    const handleRemoveItem = async (modelId: number) => {
        await removeFromCart(modelId);
    };

    const handleClearCart = async () => {
        if (confirm("Are you sure you want to clear your cart?")) {
            await clearCart();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                onOpenAuthModal={() => setShowAuthModal(true)}
                currentPage="store"
            />

            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Shopping Cart
                        </h1>
                        <p className="text-gray-400">
                            Review your selected MOC designs before checkout
                        </p>
                    </div>

                    {!isAuthenticated ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                            <svg
                                className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                Sign in to view your cart
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Create an account or sign in to add items to
                                your cart
                            </p>
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                            <svg
                                className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                Your cart is empty
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Browse our store to find amazing MOC designs
                            </p>
                            <Link
                                href="/store"
                                className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                            >
                                Browse Store
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex gap-4"
                                    >
                                        {/* Thumbnail */}
                                        <Link
                                            href={mocUrl({
                                                name: item.moc?.name || "Model",
                                                id: item.moc_id,
                                            })}
                                            className="shrink-0"
                                        >
                                            <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden">
                                                {item.moc?.thumbnail ? (
                                                    <img
                                                        src={item.moc.thumbnail}
                                                        alt={item.moc.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg
                                                            className="w-8 h-8 text-gray-600"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={mocUrl({
                                                    name:
                                                        item.moc?.name ||
                                                        "Model",
                                                    id: item.moc_id,
                                                })}
                                                className="text-lg font-semibold text-white hover:text-yellow-400 transition-colors truncate block"
                                            >
                                                {item.moc?.name || "Unknown"}
                                            </Link>
                                            <p className="text-sm text-gray-500 mb-2">
                                                by{" "}
                                                {item.moc?.user?.name ||
                                                    "Anonymous"}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                    </svg>
                                                    {item.moc?.total_parts || 0}{" "}
                                                    parts
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
                                                    {item.moc?.total_steps || 0}{" "}
                                                    steps
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Remove */}
                                        <div className="flex flex-col items-end justify-between">
                                            <span className="text-lg font-bold text-yellow-400">
                                                $
                                                {Number(
                                                    item.moc?.price || 0,
                                                ).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleRemoveItem(
                                                        item.moc_id,
                                                    )
                                                }
                                                className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Clear Cart */}
                                <button
                                    onClick={handleClearCart}
                                    className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                                >
                                    Clear all items
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-28">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        Order Summary
                                    </h2>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Items ({items.length})</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-700 pt-3 flex justify-between text-white font-semibold">
                                            <span>Total</span>
                                            <span className="text-yellow-400">
                                                ${total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {checkoutError && (
                                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                            {checkoutError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        disabled={
                                            isCheckingOut || items.length === 0
                                        }
                                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <svg
                                                    className="animate-spin h-5 w-5"
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
                                                Processing...
                                            </>
                                        ) : (
                                            <>
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
                                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                    />
                                                </svg>
                                                Proceed to Checkout
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-gray-500 text-center mt-4">
                                        Secure checkout powered by Stripe
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
