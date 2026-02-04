import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { useCart } from "../contexts/CartContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import { api, OrderData } from "../api";

interface CheckoutSuccessProps {
    session_id?: string;
}

export default function CheckoutSuccess({ session_id }: CheckoutSuccessProps) {
    const { refreshCart } = useCart();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [order, setOrder] = useState<OrderData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            // Get session_id from URL if not passed as prop
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = session_id || urlParams.get("session_id");

            if (!sessionId) {
                setError("Invalid session. No payment session found.");
                setIsVerifying(false);
                return;
            }

            try {
                const result = await api.verifyCheckout(sessionId);
                // Fetch full order details
                const orderData = await api.getOrder(result.order_id);
                setOrder(orderData);
                // Refresh cart to clear it
                await refreshCart();
            } catch (err: any) {
                setError(err.message || "Failed to verify payment.");
            } finally {
                setIsVerifying(false);
            }
        };

        verifyPayment();
    }, [session_id, refreshCart]);

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                onOpenAuthModal={() => setShowAuthModal(true)}
                currentPage="store"
            />

            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {isVerifying ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Verifying your payment...
                            </h2>
                            <p className="text-gray-400">
                                Please wait while we confirm your purchase.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center border border-red-500/50">
                            <svg
                                className="w-16 h-16 text-red-400 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h2 className="text-xl font-semibold text-red-400 mb-2">
                                Payment Verification Failed
                            </h2>
                            <p className="text-gray-400 mb-6">{error}</p>
                            <div className="flex justify-center gap-4">
                                <Link
                                    href="/cart"
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                                >
                                    Return to Cart
                                </Link>
                                <Link
                                    href="/store"
                                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                                >
                                    Browse Store
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl p-8 border border-green-500/50">
                            {/* Success Icon */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-10 h-10 text-green-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    Thank You for Your Purchase!
                                </h1>
                                <p className="text-gray-400">
                                    Your order has been successfully processed.
                                </p>
                            </div>

                            {/* Order Details */}
                            {order && (
                                <div className="border-t border-gray-700 pt-6">
                                    <div className="flex justify-between text-sm text-gray-400 mb-4">
                                        <span>Order #{order.id}</span>
                                        <span>
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Purchased Items */}
                                    <div className="space-y-3 mb-6">
                                        {order.items?.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 bg-gray-700/50 rounded-lg p-3"
                                            >
                                                <div className="w-12 h-12 bg-gray-600 rounded overflow-hidden shrink-0">
                                                    {item.moc?.thumbnail ? (
                                                        <img
                                                            src={
                                                                item.moc
                                                                    .thumbnail
                                                            }
                                                            alt={item.moc.name}
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
                                                    <p className="text-white font-medium truncate">
                                                        {item.moc?.name ||
                                                            "MOC"}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        by{" "}
                                                        {item.seller?.name ||
                                                            "Unknown"}
                                                    </p>
                                                </div>
                                                <span className="text-yellow-400 font-semibold">
                                                    $
                                                    {Number(item.price).toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div className="border-t border-gray-700 pt-4 flex justify-between text-lg font-semibold">
                                        <span className="text-white">
                                            Total Paid
                                        </span>
                                        <span className="text-yellow-400">
                                            ${Number(order.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <Link
                                    href="/dashboard"
                                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors text-center"
                                >
                                    View My Library
                                </Link>
                                <Link
                                    href="/store"
                                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-center"
                                >
                                    Continue Shopping
                                </Link>
                            </div>

                            {/* Info */}
                            <p className="text-center text-sm text-gray-500 mt-6">
                                You can now access your purchased MOC files in
                                your library. A receipt has been sent to your
                                email.
                            </p>
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
