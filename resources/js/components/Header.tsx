import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import UserMenu from "./UserMenu";

interface HeaderProps {
    onOpenAuthModal?: () => void;
    fixed?: boolean;
    currentPage?: "home" | "store" | "catalog" | "viewer" | "dashboard";
}

export default function Header({
    onOpenAuthModal,
    fixed = true,
    currentPage,
}: HeaderProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const { itemCount } = useCart();

    const navLinkClass = (page: string) => {
        if (currentPage === page) {
            return "text-yellow-400 font-medium";
        }
        return "text-gray-300 hover:text-white transition-colors";
    };

    return (
        <header
            className={`${fixed ? "fixed top-0 left-0 right-0 z-50" : ""} bg-gray-900/80 backdrop-blur-md border-b border-gray-700`}
        >
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="flex items-center justify-between h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">
                            BrickVault
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className={navLinkClass("home")}>
                            Home
                        </Link>
                        <Link href="/store" className={navLinkClass("store")}>
                            Store
                        </Link>
                        <Link
                            href="/catalog"
                            className={navLinkClass("catalog")}
                        >
                            Catalog
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Cart Icon */}
                        {isAuthenticated && (
                            <Link
                                href="/cart"
                                className="relative p-2 text-gray-300 hover:text-white transition-colors"
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
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                                        {itemCount > 9 ? "9+" : itemCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <UserMenu />
                        ) : isLoading ? (
                            <div className="w-20 h-10 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenAuthModal}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
