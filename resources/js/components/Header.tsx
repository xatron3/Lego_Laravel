import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import UserMenu from "./UserMenu";

interface HeaderProps {
    onOpenAuthModal?: () => void;
    fixed?: boolean;
    currentPage?: "home" | "store" | "viewer" | "dashboard";
}

export default function Header({
    onOpenAuthModal,
    fixed = true,
    currentPage,
}: HeaderProps) {
    const { isAuthenticated } = useAuth();

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
                        <Link href="/viewer" className={navLinkClass("viewer")}>
                            Viewer
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <UserMenu />
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
