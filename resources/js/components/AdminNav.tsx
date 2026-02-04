import { useAuth } from "../contexts/AuthContext";

interface AdminNavProps {
    currentPage?: "dashboard" | "users" | "models" | "sales" | "data-import";
}

export default function AdminNav({ currentPage }: AdminNavProps) {
    const { isAdmin, isMod } = useAuth();

    const navItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            href: "/admin/dashboard",
            adminOnly: false,
        },
        { id: "users", label: "Users", href: "/admin/users", adminOnly: true },
        {
            id: "models",
            label: "Models",
            href: "/admin/models",
            adminOnly: false,
        },
        { id: "sales", label: "Sales", href: "/admin/sales", adminOnly: true },
        {
            id: "data-import",
            label: "Data Import",
            href: "/admin/data-import",
            adminOnly: true,
        },
    ];

    return (
        <nav className="flex gap-2 mb-6 flex-wrap border-b border-gray-700 pb-4">
            {navItems.map((item) => {
                // Skip admin-only items for mods
                if (item.adminOnly && !isAdmin) return null;

                const isActive = currentPage === item.id;

                return (
                    <a
                        key={item.id}
                        href={item.href}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            isActive
                                ? "bg-yellow-500 text-gray-900"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    >
                        {item.label}
                    </a>
                );
            })}
        </nav>
    );
}
