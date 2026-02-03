import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface UserMenuProps {
    onOpenAuthModal?: () => void;
}

export default function UserMenu({ onOpenAuthModal }: UserMenuProps) {
    const { user, isAuthenticated, logout, isAdmin, isMod } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
    };

    const getRoleBadge = () => {
        if (!user || !user.role) return null;

        const roleColors: Record<string, string> = {
            admin: "bg-red-500/20 text-red-400 border-red-500/50",
            mod: "bg-purple-500/20 text-purple-400 border-purple-500/50",
            submitter: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            normal: "bg-gray-500/20 text-gray-400 border-gray-500/50",
        };

        return (
            <span
                className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[user.role] || roleColors.normal}`}
            >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
        );
    };

    if (!isAuthenticated) {
        return (
            <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
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
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                </svg>
                Sign In
            </button>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-yellow-400"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}
                <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white">
                        {user?.name}
                    </div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate">
                                    {user?.name}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {getRoleBadge()}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <a
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
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
                                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                                />
                            </svg>
                            Dashboard
                        </a>

                        {(isAdmin || isMod) && (
                            <>
                                <div className="my-2 border-t border-gray-700"></div>
                                <a
                                    href="/admin"
                                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
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
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    Admin Panel
                                </a>
                            </>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-700 py-2">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
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
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
