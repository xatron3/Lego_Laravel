import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import SalesAnalytics from "../components/SalesAnalytics";
import MocSubmitWizard from "../components/moc/MocSubmitWizard";
import MocEditModal from "../components/moc/MocEditModal";
import { api, LegoModelData } from "../api";

type TabType = "my-models" | "submit" | "settings" | "sales";
type FilterType = "all" | "created" | "owned";

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("my-models");
    const [models, setModels] = useState<LegoModelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    // Edit modal state
    const [editingMoc, setEditingMoc] = useState<LegoModelData | null>(null);

    // Settings state
    const [settingsName, setSettingsName] = useState(user?.name || "");
    const [settingsEmail, setSettingsEmail] = useState(user?.email || "");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadModels();
        }
    }, [isAuthenticated, filter]);

    useEffect(() => {
        if (user) {
            setSettingsName(user.name);
            setSettingsEmail(user.email);
        }
    }, [user]);

    const loadModels = async () => {
        setIsLoading(true);
        try {
            const data = await api.getDashboardModels(filter);
            setModels(data);
        } catch (error) {
            console.error("Failed to load models:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMocSubmitSuccess = () => {
        loadModels();
        setActiveTab("my-models");
    };

    const handleMocEditSave = (updatedMoc: LegoModelData) => {
        setModels((prev) =>
            prev.map((m) => (m.id === updatedMoc.id ? updatedMoc : m)),
        );
        setEditingMoc(null);
    };

    const handleDeleteModel = async (id: number) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            await api.deleteModel(id);
            loadModels();
        } catch (error: any) {
            console.error("Failed to delete model:", error);
            const message = error?.message || "Failed to delete model";
            alert(message);
        }
    };

    const handleUnclaimModel = async (id: number) => {
        if (
            !confirm(
                "Are you sure you want to remove this model from your library?",
            )
        )
            return;
        try {
            await api.unclaimModel(id);
            loadModels();
        } catch (error: any) {
            console.error("Failed to remove model:", error);
            alert(error.message || "Failed to remove model");
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await api.updateSettings({
                name: settingsName,
                email: settingsEmail,
            });
            alert("Settings saved successfully!");
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            alert(error.message || "Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Please sign in to access your dashboard
                    </h1>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                        Sign In
                    </button>
                </div>
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
            </div>
        );
    }

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
                            <button
                                onClick={() => setActiveTab("my-models")}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                    activeTab === "my-models"
                                        ? "bg-yellow-500 text-gray-900 font-semibold shadow-lg"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                }`}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                My Models
                            </button>

                            <button
                                onClick={() => setActiveTab("submit")}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                    activeTab === "submit"
                                        ? "bg-yellow-500 text-gray-900 font-semibold shadow-lg"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                }`}
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Submit Model
                            </button>

                            <button
                                onClick={() => setActiveTab("sales")}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                    activeTab === "sales"
                                        ? "bg-yellow-500 text-gray-900 font-semibold shadow-lg"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                }`}
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
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Sales & Earnings
                            </button>

                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                    activeTab === "settings"
                                        ? "bg-yellow-500 text-gray-900 font-semibold shadow-lg"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                }`}
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
                                Settings
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* My Models Tab */}
                        {activeTab === "my-models" && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h1 className="text-2xl font-bold text-white">
                                        My Models
                                    </h1>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFilter("all")}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                filter === "all"
                                                    ? "bg-yellow-500 text-gray-900"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setFilter("created")}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                filter === "created"
                                                    ? "bg-yellow-500 text-gray-900"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                        >
                                            Created by Me
                                        </button>
                                        <button
                                            onClick={() => setFilter("owned")}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                filter === "owned"
                                                    ? "bg-yellow-500 text-gray-900"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                        >
                                            Purchased/Claimed
                                        </button>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                                    </div>
                                ) : models.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {models.map((model) => (
                                            <div
                                                key={model.id}
                                                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                                            >
                                                <div className="aspect-video bg-gray-700 relative">
                                                    {model.thumbnail ? (
                                                        <img
                                                            src={`${model.thumbnail}`}
                                                            alt={model.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg
                                                                className="w-12 h-12 text-gray-600"
                                                                fill="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {model.user_id ===
                                                        user?.id && (
                                                        <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                                                            Created
                                                        </span>
                                                    )}
                                                    {model.is_public ? (
                                                        <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                                            Public
                                                        </span>
                                                    ) : (
                                                        <span className="absolute top-2 right-2 px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="text-lg font-semibold text-white mb-2 truncate">
                                                        {model.name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                                        <span>
                                                            {model.total_parts}{" "}
                                                            parts
                                                        </span>
                                                        <span>
                                                            {model.total_steps}{" "}
                                                            steps
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/viewer/${model.id}`}
                                                            className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium text-center rounded-lg transition-colors"
                                                        >
                                                            View
                                                        </Link>
                                                        {model.user_id ===
                                                        user?.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        setEditingMoc(
                                                                            model,
                                                                        )
                                                                    }
                                                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                                                                    title="Edit"
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteModel(
                                                                            model.id!,
                                                                        )
                                                                    }
                                                                    className="px-3 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg transition-colors"
                                                                    title="Delete"
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            (model as any)
                                                                .ownership_type ===
                                                                "claimed" && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleUnclaimModel(
                                                                            model.id!,
                                                                        )
                                                                    }
                                                                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg
                                            className="w-16 h-16 text-gray-600 mx-auto mb-4"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                            No models yet
                                        </h3>
                                        <p className="text-gray-500 mb-6">
                                            {filter === "created"
                                                ? "You haven't created any models yet."
                                                : filter === "owned"
                                                  ? "You haven't purchased or claimed any models yet."
                                                  : "Start by uploading your first model!"}
                                        </p>
                                        <button
                                            onClick={() =>
                                                setActiveTab("submit")
                                            }
                                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                                        >
                                            Submit New Model
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Model Tab */}
                        {activeTab === "submit" && (
                            <MocSubmitWizard
                                onSuccess={handleMocSubmitSuccess}
                                onCancel={() => setActiveTab("my-models")}
                            />
                        )}

                        {/* Sales Tab */}
                        {activeTab === "sales" && <SalesAnalytics />}

                        {/* Settings Tab */}
                        {activeTab === "settings" && (
                            <div className="max-w-2xl">
                                <h1 className="text-2xl font-bold text-white mb-6">
                                    Settings
                                </h1>

                                <div className="space-y-6">
                                    {/* Profile Section */}
                                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                        <h2 className="text-lg font-semibold text-white mb-4">
                                            Profile
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settingsName}
                                                    onChange={(e) =>
                                                        setSettingsName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={settingsEmail}
                                                    onChange={(e) =>
                                                        setSettingsEmail(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveSettings}
                                                disabled={isSavingSettings}
                                                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isSavingSettings
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Account Section */}
                                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                        <h2 className="text-lg font-semibold text-white mb-4">
                                            Account
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                                <div>
                                                    <div className="text-white font-medium">
                                                        Role
                                                    </div>
                                                    <div className="text-gray-400 text-sm capitalize">
                                                        {user?.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                                <div>
                                                    <div className="text-white font-medium">
                                                        Member Since
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {user?.created_at
                                                            ? new Date(
                                                                  user.created_at,
                                                              ).toLocaleDateString()
                                                            : "Unknown"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-gray-800 rounded-xl p-6 border border-red-500/50">
                                        <h2 className="text-lg font-semibold text-red-400 mb-4">
                                            Danger Zone
                                        </h2>
                                        <p className="text-gray-400 mb-4">
                                            Once you delete your account, there
                                            is no going back. Please be certain.
                                        </p>
                                        <button className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {/* Edit MOC Modal */}
            {editingMoc && (
                <MocEditModal
                    moc={editingMoc}
                    isOpen={true}
                    onClose={() => setEditingMoc(null)}
                    onSave={handleMocEditSave}
                />
            )}
        </div>
    );
}
