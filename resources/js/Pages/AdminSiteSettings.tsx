import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";
import { api } from "../api";

interface SiteSetting {
    id: number;
    key: string;
    content: any;
    description: string | null;
}

interface MocOption {
    id: number;
    name: string;
    thumbnail: string | null;
}

export default function AdminSiteSettings() {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    // Pro demo MOCs
    const [demoMocIds, setDemoMocIds] = useState<number[]>([]);
    const [mocSearchQuery, setMocSearchQuery] = useState("");
    const [mocSearchResults, setMocSearchResults] = useState<MocOption[]>([]);
    const [isSearchingMocs, setIsSearchingMocs] = useState(false);

    // Flip transaction limit
    const [flipLimit, setFlipLimit] = useState<number>(100);

    useEffect(() => {
        if (isAdmin) {
            fetchSettings();
        }
    }, [isAdmin]);

    const fetchSettings = async () => {
        try {
            const data = await api.getAdminSettings();
            setSettings(data);

            // Extract specific settings
            const demoSetting = data.find((s) => s.key === "pro_demo_moc_ids");
            if (demoSetting) {
                setDemoMocIds(demoSetting.content || []);
            }

            const flipSetting = data.find(
                (s) => s.key === "free_flip_transaction_limit",
            );
            if (flipSetting) {
                setFlipLimit(flipSetting.content || 100);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSetting = async (key: string, content: any) => {
        setSavingKey(key);
        try {
            await api.updateAdminSetting(key, content);
            await fetchSettings();
        } catch (err) {
            console.error("Failed to save setting:", err);
            alert("Failed to save setting");
        } finally {
            setSavingKey(null);
        }
    };

    const searchMocs = async (query: string) => {
        setMocSearchQuery(query);
        if (query.length < 2) {
            setMocSearchResults([]);
            return;
        }

        setIsSearchingMocs(true);
        try {
            const response = await fetch(
                `/api/mocs?search=${encodeURIComponent(query)}&per_page=10`,
                {
                    headers: { Accept: "application/json" },
                    credentials: "same-origin",
                },
            );
            if (response.ok) {
                const data = await response.json();
                const mocs = (data.data || []).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    thumbnail: m.thumbnail || m.display_thumbnail,
                }));
                setMocSearchResults(mocs);
            }
        } catch (err) {
            console.error("Failed to search MOCs:", err);
        } finally {
            setIsSearchingMocs(false);
        }
    };

    const addDemoMoc = (id: number) => {
        if (!demoMocIds.includes(id)) {
            const newIds = [...demoMocIds, id];
            setDemoMocIds(newIds);
            saveSetting("pro_demo_moc_ids", newIds);
        }
        setMocSearchQuery("");
        setMocSearchResults([]);
    };

    const removeDemoMoc = (id: number) => {
        const newIds = demoMocIds.filter((mid) => mid !== id);
        setDemoMocIds(newIds);
        saveSetting("pro_demo_moc_ids", newIds);
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Access Denied
                    </h1>
                    <button
                        onClick={() => router.visit("/")}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header currentPage="dashboard" />

            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="pt-24 pb-12">
                    <AdminNav currentPage="site-settings" />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Site Settings
                        </h1>
                        <p className="text-gray-400">
                            Manage global site configuration
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Pro Demo MOCs */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Pro Page Demo Models
                                </h2>
                                <p className="text-gray-400 text-sm mb-4">
                                    Select which MOC models are shown as demos
                                    on the Pro subscription promo page. These
                                    will be available in the 3D viewer demo.
                                </p>

                                {/* Current demo MOCs */}
                                <div className="mb-4">
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Current Demo MOCs ({demoMocIds.length})
                                    </label>
                                    {demoMocIds.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">
                                            No demo MOCs selected yet. Search
                                            and add models below.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {demoMocIds.map((id) => (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg text-sm text-gray-200"
                                                >
                                                    MOC #{id}
                                                    <button
                                                        onClick={() =>
                                                            removeDemoMoc(id)
                                                        }
                                                        className="text-red-400 hover:text-red-300"
                                                    >
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
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Search for MOCs */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={mocSearchQuery}
                                        onChange={(e) =>
                                            searchMocs(e.target.value)
                                        }
                                        placeholder="Search MOCs by name to add..."
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    {isSearchingMocs && (
                                        <div className="absolute right-3 top-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                                        </div>
                                    )}

                                    {mocSearchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {mocSearchResults.map((moc) => (
                                                <button
                                                    key={moc.id}
                                                    onClick={() =>
                                                        addDemoMoc(moc.id)
                                                    }
                                                    disabled={demoMocIds.includes(
                                                        moc.id,
                                                    )}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors text-left disabled:opacity-50"
                                                >
                                                    {moc.thumbnail && (
                                                        <img
                                                            src={moc.thumbnail}
                                                            alt=""
                                                            className="w-10 h-8 rounded object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="text-white text-sm font-medium">
                                                            {moc.name}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            ID: {moc.id}
                                                        </p>
                                                    </div>
                                                    {demoMocIds.includes(
                                                        moc.id,
                                                    ) && (
                                                        <span className="ml-auto text-xs text-yellow-500">
                                                            Added
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Free Flip Transaction Limit */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Free Tier Limits
                                </h2>
                                <p className="text-gray-400 text-sm mb-4">
                                    Configure limits for free (non-Pro) users.
                                </p>

                                <div className="max-w-xs">
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Max Flip Transactions (Free Users)
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            value={flipLimit}
                                            onChange={(e) =>
                                                setFlipLimit(
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                            min={0}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                        <button
                                            onClick={() =>
                                                saveSetting(
                                                    "free_flip_transaction_limit",
                                                    flipLimit,
                                                )
                                            }
                                            disabled={
                                                savingKey ===
                                                "free_flip_transaction_limit"
                                            }
                                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {savingKey ===
                                            "free_flip_transaction_limit"
                                                ? "Saving..."
                                                : "Save"}
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Free users can create up to this many
                                        parent flip transactions. Pro users have
                                        unlimited.
                                    </p>
                                </div>
                            </div>

                            {/* All Settings (Raw View) */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h2 className="text-xl font-semibold text-white mb-4">
                                    All Settings
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                    Key
                                                </th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                    Value
                                                </th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                    Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settings.map((setting) => (
                                                <tr
                                                    key={setting.id}
                                                    className="border-b border-gray-700/50"
                                                >
                                                    <td className="py-3 px-4 text-yellow-400 font-mono text-xs">
                                                        {setting.key}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-300 font-mono text-xs max-w-xs truncate">
                                                        {JSON.stringify(
                                                            setting.content,
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500 text-xs">
                                                        {setting.description ||
                                                            "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
