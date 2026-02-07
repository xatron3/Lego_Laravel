import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";

interface DashboardLayoutProps {
    children: React.ReactNode;
    currentPage:
        | "my-models"
        | "submit"
        | "sales"
        | "settings"
        | "flipping"
        | "notifications";
}

export default function DashboardLayout({
    children,
    currentPage,
}: DashboardLayoutProps) {
    const { user } = useAuth();

    const menuItems = [
        {
            id: "my-models" as const,
            label: "My Models",
            href: "/dashboard/my-models",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            ),
        },
        {
            id: "submit" as const,
            label: "Submit Model",
            href: "/dashboard/submit",
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
                        d="M12 4v16m8-8H4"
                    />
                </svg>
            ),
        },
        {
            id: "flipping" as const,
            label: "Flipping Tracker",
            href: "/dashboard/flipping",
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
        },
        {
            id: "sales" as const,
            label: "Sales & Earnings",
            href: "/dashboard/sales",
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
        },
        {
            id: "settings" as const,
            label: "Settings",
            href: "/dashboard/settings",
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
        },
        {
            id: "notifications" as const,
            label: "Notifications",
            href: "/dashboard/notifications",
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            <Header currentPage="dashboard" />

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="pt-24 pb-12 flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-64 shrink-0">
                        <div className="mb-8">
                            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-xl font-bold text-white">
                                            {user?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold truncate">
                                            {user?.name}
                                        </div>
                                        <div className="text-gray-400 text-xs uppercase tracking-wide">
                                            {user?.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                        currentPage === item.id
                                            ? "bg-yellow-500 text-gray-900 font-semibold shadow-lg"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </div>
    );
}
