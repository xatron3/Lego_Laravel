import { Link } from "@inertiajs/react";

interface ProBadgeProps {
    size?: "sm" | "md";
    className?: string;
}

export default function ProBadge({
    size = "sm",
    className = "",
}: ProBadgeProps) {
    const sizeClasses =
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

    return (
        <Link
            href="/pro"
            className={`inline-flex items-center gap-1 ${sizeClasses} bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 font-bold rounded-md uppercase tracking-wider hover:from-yellow-500/30 hover:to-orange-500/30 transition-colors ${className}`}
        >
            <svg
                className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"}
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Pro
        </Link>
    );
}
