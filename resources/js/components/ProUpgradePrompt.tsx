import { Link } from "@inertiajs/react";

interface ProUpgradePromptProps {
    feature: string;
    description?: string;
    compact?: boolean;
}

export default function ProUpgradePrompt({
    feature,
    description,
    compact = false,
}: ProUpgradePromptProps) {
    if (compact) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <svg
                    className="w-5 h-5 text-yellow-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p className="text-sm text-gray-300 flex-1">
                    <span className="text-yellow-400 font-medium">Pro</span>{" "}
                    required for {feature}.
                </p>
                <Link
                    href="/pro"
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                    Upgrade
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro Feature</h3>
            <p className="text-gray-400 mb-2 max-w-md">
                {description ||
                    `${feature} is available exclusively for Pro members.`}
            </p>
            <p className="text-gray-500 text-sm mb-6">
                Upgrade to Pro for just $3.99/month to unlock this and more.
            </p>
            <Link
                href="/pro"
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-xl transition-all transform hover:scale-105"
            >
                Upgrade to Pro
            </Link>
        </div>
    );
}
