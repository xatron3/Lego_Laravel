import { Link } from "@inertiajs/react";

interface CatalogNavProps {
    active?: "discover" | "sets" | "mocs" | "parts" | "minifigs" | "themes";
    stats?: {
        sets?: number;
        mocs?: number;
        parts?: number;
        minifigs?: number;
        themes?: number;
    };
}

const navItems = [
    {
        key: "discover",
        label: "Discover",
        href: "/catalog",
        icon: "✨",
    },
    { key: "sets", label: "Sets", href: "/catalog/sets", icon: "📦" },
    { key: "mocs", label: "MOCs", href: "/catalog/mocs", icon: "🔨" },
    { key: "parts", label: "Parts", href: "/catalog/parts", icon: "🧱" },
    {
        key: "minifigs",
        label: "Minifigs",
        href: "/catalog/minifigs",
        icon: "🧑",
    },
    {
        key: "themes",
        label: "Themes",
        href: "/catalog/themes",
        icon: "🏷️",
    },
] as const;

/**
 * Catalog section navigation - links between catalog sub-pages.
 */
export default function CatalogNav({ active, stats }: CatalogNavProps) {
    return (
        <nav className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-4">
            {navItems.map((item) => {
                const count =
                    item.key !== "discover"
                        ? stats?.[item.key as keyof typeof stats]
                        : undefined;
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                            active === item.key
                                ? "bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/20"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {count !== undefined && (
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    active === item.key
                                        ? "bg-gray-900/20"
                                        : "bg-gray-700 text-gray-400"
                                }`}
                            >
                                {count?.toLocaleString()}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
