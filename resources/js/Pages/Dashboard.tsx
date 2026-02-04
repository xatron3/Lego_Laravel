import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import { api, LegoModelData } from "../api";
import { useModelLoader } from "../hooks/useModelLoader";

type TabType = "my-models" | "submit" | "settings" | "admin";
type FilterType = "all" | "created" | "owned";

export default function Dashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const { steps, modelText, loadFile, reset } = useModelLoader();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("my-models");
    const [models, setModels] = useState<LegoModelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    // Submit form state
    const [modelName, setModelName] = useState("");
    const [modelDescription, setModelDescription] = useState("");
    const [modelIsPublic, setModelIsPublic] = useState(false);
    const [modelPrice, setModelPrice] = useState("");
    const [currentFileName, setCurrentFileName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Settings state
    const [settingsName, setSettingsName] = useState(user?.name || "");
    const [settingsEmail, setSettingsEmail] = useState(user?.email || "");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Admin Rebrickable state
    const [rebrickableStats, setRebrickableStats] = useState<
        Record<string, number>
    >({});
    const [rebrickableTables, setRebrickableTables] = useState<
        Record<
            string,
            { has_file: boolean; columns: string[]; primary_key: string | null }
        >
    >({});
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableRecords, setTableRecords] = useState<any[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tablePagination, setTablePagination] = useState({
        page: 1,
        lastPage: 1,
        total: 0,
    });
    const [tableSearch, setTableSearch] = useState("");
    const [importingTable, setImportingTable] = useState<string | null>(null);
    const [importingAll, setImportingAll] = useState(false);
    const [importResults, setImportResults] = useState<{
        results: Record<string, number>;
        errors: Record<string, string>;
    } | null>(null);

    const isAdmin = user?.role === "admin";

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCurrentFileName(file.name);
        await loadFile(file);
        setSubmitSuccess(false);
    };

    const handleSubmitModel = async () => {
        if (!modelText || !modelName.trim()) return;
        setIsSaving(true);
        try {
            const totalParts = steps.reduce(
                (sum, step) => sum + step.parts.length,
                0,
            );
            await api.saveModel({
                name: modelName.trim(),
                description: modelDescription.trim() || undefined,
                ldr_content: modelText,
                file_name: currentFileName,
                total_steps: steps.length,
                total_parts: totalParts,
                is_public: modelIsPublic,
                price: modelPrice ? parseFloat(modelPrice) : null,
            });
            setSubmitSuccess(true);
            setModelName("");
            setModelDescription("");
            setModelIsPublic(false);
            setModelPrice("");
            setCurrentFileName("");
            reset();
            // Refresh models list
            if (activeTab === "my-models") {
                loadModels();
            }
        } catch (error) {
            console.error("Failed to save model:", error);
            alert("Failed to save model");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteModel = async (id: number) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            await api.deleteModel(id);
            loadModels();
        } catch (error) {
            console.error("Failed to delete model:", error);
            alert("Failed to delete model");
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

    // Admin functions
    const loadRebrickableData = async () => {
        if (!isAdmin) return;
        try {
            const [stats, tables] = await Promise.all([
                api.getRebrickableStats(),
                api.getRebrickableTables(),
            ]);
            setRebrickableStats(stats);
            setRebrickableTables(tables);
        } catch (error) {
            console.error("Failed to load Rebrickable data:", error);
        }
    };

    const loadTableRecords = async (table: string, page = 1) => {
        setTableLoading(true);
        try {
            const result = await api.getRebrickableRecords(table, {
                search: tableSearch,
                page,
                per_page: 20,
            });
            setTableRecords(result.data);
            setTablePagination({
                page: result.current_page,
                lastPage: result.last_page,
                total: result.total,
            });
        } catch (error) {
            console.error("Failed to load records:", error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleImportTable = async (table: string) => {
        setImportingTable(table);
        try {
            const result = await api.importRebrickableTable(table);
            alert(result.message);
            loadRebrickableData();
            if (selectedTable === table) {
                loadTableRecords(table);
            }
        } catch (error: any) {
            alert(error.message || "Import failed");
        } finally {
            setImportingTable(null);
        }
    };

    const handleImportAll = async () => {
        if (
            !confirm(
                "This will import all CSV files from the data folder. This may take a while. Continue?",
            )
        )
            return;
        setImportingAll(true);
        setImportResults(null);
        try {
            const result = await api.importAllRebrickableTables();
            setImportResults({
                results: result.results,
                errors: result.errors,
            });
            loadRebrickableData();
        } catch (error: any) {
            alert(error.message || "Import failed");
        } finally {
            setImportingAll(false);
        }
    };

    const handleClearTable = async (table: string) => {
        if (!confirm(`Are you sure you want to clear all data from ${table}?`))
            return;
        try {
            await api.clearRebrickableTable(table);
            loadRebrickableData();
            if (selectedTable === table) {
                loadTableRecords(table);
            }
        } catch (error: any) {
            alert(error.message || "Clear failed");
        }
    };

    const handleClearAll = async () => {
        if (
            !confirm(
                "Are you sure you want to clear ALL Rebrickable data? This cannot be undone!",
            )
        )
            return;
        try {
            await api.clearAllRebrickableTables();
            loadRebrickableData();
            setSelectedTable(null);
            setTableRecords([]);
        } catch (error: any) {
            alert(error.message || "Clear failed");
        }
    };

    const handleCsvFileUpload = async (table: string, file: File) => {
        setImportingTable(table);
        try {
            const result = await api.uploadRebrickableCsv(table, file);
            alert(result.message);
            loadRebrickableData();
            if (selectedTable === table) {
                loadTableRecords(table);
            }
        } catch (error: any) {
            alert(error.message || "Upload failed");
        } finally {
            setImportingTable(null);
        }
    };

    useEffect(() => {
        if (isAdmin && activeTab === "admin") {
            loadRebrickableData();
        }
    }, [isAdmin, activeTab]);

    useEffect(() => {
        if (selectedTable) {
            loadTableRecords(selectedTable);
        }
    }, [selectedTable, tableSearch]);

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

            {/* Main Content */}
            <div className="pt-20 flex">
                {/* Sidebar */}
                <aside className="w-64 fixed left-0 top-16 bottom-0 bg-gray-800 border-r border-gray-700 p-4">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-white">
                                    {user?.name?.charAt(0).toUpperCase() || "?"}
                                </span>
                            </div>
                            <div>
                                <div className="text-white font-medium truncate">
                                    {user?.name}
                                </div>
                                <div className="text-gray-400 text-sm capitalize">
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab("my-models")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === "my-models"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "text-gray-300 hover:bg-gray-700"
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === "submit"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "text-gray-300 hover:bg-gray-700"
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
                            onClick={() => setActiveTab("settings")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === "settings"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "text-gray-300 hover:bg-gray-700"
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

                        {/* Admin Tab - Only visible to admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab("admin")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === "admin"
                                        ? "bg-red-500 text-white"
                                        : "text-red-400 hover:bg-gray-700"
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
                                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                    />
                                </svg>
                                Data Import
                            </button>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-8">
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
                                                        src={`/storage/${model.thumbnail}`}
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
                                                {model.user_id === user?.id && (
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
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteModel(
                                                                    model.id!,
                                                                )
                                                            }
                                                            className="px-3 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg transition-colors"
                                                        >
                                                            Delete
                                                        </button>
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
                                        onClick={() => setActiveTab("submit")}
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
                        <div className="max-w-2xl">
                            <h1 className="text-2xl font-bold text-white mb-6">
                                Submit New Model
                            </h1>

                            {submitSuccess && (
                                <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                                    Model submitted successfully! You can view
                                    it in My Models.
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* File Upload */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        LDraw File (.ldr, .mpd)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-yellow-500 transition-colors">
                                        <input
                                            type="file"
                                            accept=".ldr,.mpd"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer"
                                        >
                                            {currentFileName ? (
                                                <div>
                                                    <svg
                                                        className="w-12 h-12 text-green-400 mx-auto mb-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    <p className="text-white font-medium">
                                                        {currentFileName}
                                                    </p>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {steps.length} steps,{" "}
                                                        {steps.reduce(
                                                            (sum, s) =>
                                                                sum +
                                                                s.parts.length,
                                                            0,
                                                        )}{" "}
                                                        parts
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg
                                                        className="w-12 h-12 text-gray-400 mx-auto mb-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                        />
                                                    </svg>
                                                    <p className="text-gray-400">
                                                        Click to upload or drag
                                                        and drop
                                                    </p>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        .ldr or .mpd files only
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Model Name */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Model Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={modelName}
                                        onChange={(e) =>
                                            setModelName(e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder="Enter model name"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={modelDescription}
                                        onChange={(e) =>
                                            setModelDescription(e.target.value)
                                        }
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                        placeholder="Describe your model..."
                                    />
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={modelIsPublic}
                                            onChange={(e) =>
                                                setModelIsPublic(
                                                    e.target.checked,
                                                )
                                            }
                                            className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700"
                                        />
                                        <span className="text-white">
                                            Make this model public
                                        </span>
                                    </label>
                                    <p className="text-gray-400 text-sm mt-1 ml-8">
                                        Public models will be visible in the
                                        store
                                    </p>
                                </div>

                                {/* Price (only if public) */}
                                {modelIsPublic && (
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Price (leave empty for free)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={modelPrice}
                                                onChange={(e) =>
                                                    setModelPrice(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-3 pl-8 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitModel}
                                    disabled={
                                        !modelText ||
                                        !modelName.trim() ||
                                        isSaving
                                    }
                                    className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                            Submitting...
                                        </span>
                                    ) : (
                                        "Submit Model"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

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
                                        Once you delete your account, there is
                                        no going back. Please be certain.
                                    </p>
                                    <button className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Tab */}
                    {activeTab === "admin" && isAdmin && (
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-6">
                                Rebrickable Data Import
                            </h1>

                            {/* Import All Section */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white mb-2">
                                            Bulk Import
                                        </h2>
                                        <p className="text-gray-400 text-sm">
                                            Import all CSV files from the data
                                            folder at once. Files should be
                                            placed in{" "}
                                            <code className="bg-gray-700 px-1 rounded">
                                                data/
                                            </code>{" "}
                                            folder.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleImportAll}
                                            disabled={importingAll}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {importingAll ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Importing...
                                                </span>
                                            ) : (
                                                "Import All"
                                            )}
                                        </button>
                                        <button
                                            onClick={handleClearAll}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Import Results */}
                                {importResults && (
                                    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                                        <h3 className="text-white font-medium mb-2">
                                            Import Results
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                            {Object.entries(
                                                importResults.results,
                                            ).map(([table, count]) => (
                                                <div
                                                    key={table}
                                                    className="flex justify-between p-2 bg-gray-600 rounded"
                                                >
                                                    <span className="text-gray-300">
                                                        {table}
                                                    </span>
                                                    <span className="text-green-400">
                                                        {count.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {Object.keys(importResults.errors)
                                            .length > 0 && (
                                            <div className="mt-2">
                                                <h4 className="text-red-400 font-medium mb-1">
                                                    Errors
                                                </h4>
                                                {Object.entries(
                                                    importResults.errors,
                                                ).map(([table, error]) => (
                                                    <div
                                                        key={table}
                                                        className="text-red-300 text-sm"
                                                    >
                                                        {table}: {error}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Table Stats */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Database Statistics
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {Object.entries(rebrickableStats).map(
                                        ([table, count]) => (
                                            <div
                                                key={table}
                                                className="bg-gray-700 rounded-lg p-4 text-center"
                                            >
                                                <div className="text-2xl font-bold text-yellow-400">
                                                    {count.toLocaleString()}
                                                </div>
                                                <div className="text-gray-400 text-sm mt-1">
                                                    {table.replace(/_/g, " ")}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Individual Table Import */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Individual Table Import
                                </h2>
                                <div className="space-y-3">
                                    {Object.entries(rebrickableTables).map(
                                        ([table, info]) => (
                                            <div
                                                key={table}
                                                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <div className="text-white font-medium">
                                                            {table}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            {info.columns.join(
                                                                ", ",
                                                            )}
                                                        </div>
                                                    </div>
                                                    {info.has_file ? (
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                                            CSV available
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded">
                                                            No CSV
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedTable(
                                                                selectedTable ===
                                                                    table
                                                                    ? null
                                                                    : table,
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                                                    >
                                                        {selectedTable === table
                                                            ? "Hide"
                                                            : "Browse"}
                                                    </button>
                                                    {info.has_file && (
                                                        <button
                                                            onClick={() =>
                                                                handleImportTable(
                                                                    table,
                                                                )
                                                            }
                                                            disabled={
                                                                importingTable ===
                                                                table
                                                            }
                                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            {importingTable ===
                                                            table
                                                                ? "..."
                                                                : "Import"}
                                                        </button>
                                                    )}
                                                    <label className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors cursor-pointer">
                                                        Upload
                                                        <input
                                                            type="file"
                                                            accept=".csv"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file =
                                                                    e.target
                                                                        .files?.[0];
                                                                if (file)
                                                                    handleCsvFileUpload(
                                                                        table,
                                                                        file,
                                                                    );
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        onClick={() =>
                                                            handleClearTable(
                                                                table,
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Table Browser */}
                            {selectedTable && (
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-white">
                                            {selectedTable} (
                                            {tablePagination.total.toLocaleString()}{" "}
                                            records)
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="text"
                                                value={tableSearch}
                                                onChange={(e) =>
                                                    setTableSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Search..."
                                                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                        </div>
                                    </div>

                                    {tableLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-700">
                                                            {rebrickableTables[
                                                                selectedTable
                                                            ]?.columns.map(
                                                                (col) => (
                                                                    <th
                                                                        key={
                                                                            col
                                                                        }
                                                                        className="px-4 py-3 text-left text-gray-400 font-medium"
                                                                    >
                                                                        {col}
                                                                    </th>
                                                                ),
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tableRecords.map(
                                                            (record, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="border-b border-gray-700/50 hover:bg-gray-700/50"
                                                                >
                                                                    {rebrickableTables[
                                                                        selectedTable
                                                                    ]?.columns.map(
                                                                        (
                                                                            col,
                                                                        ) => (
                                                                            <td
                                                                                key={
                                                                                    col
                                                                                }
                                                                                className="px-4 py-3 text-gray-300"
                                                                            >
                                                                                {col ===
                                                                                    "rgb" &&
                                                                                record[
                                                                                    col
                                                                                ] ? (
                                                                                    <span className="flex items-center gap-2">
                                                                                        <span
                                                                                            className="w-4 h-4 rounded border border-gray-600"
                                                                                            style={{
                                                                                                backgroundColor: `#${record[col]}`,
                                                                                            }}
                                                                                        ></span>
                                                                                        {
                                                                                            record[
                                                                                                col
                                                                                            ]
                                                                                        }
                                                                                    </span>
                                                                                ) : typeof record[
                                                                                      col
                                                                                  ] ===
                                                                                  "boolean" ? (
                                                                                    record[
                                                                                        col
                                                                                    ] ? (
                                                                                        "Yes"
                                                                                    ) : (
                                                                                        "No"
                                                                                    )
                                                                                ) : (
                                                                                    String(
                                                                                        record[
                                                                                            col
                                                                                        ] ??
                                                                                            "",
                                                                                    )
                                                                                )}
                                                                            </td>
                                                                        ),
                                                                    )}
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {tablePagination.lastPage > 1 && (
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-gray-400 text-sm">
                                                        Page{" "}
                                                        {tablePagination.page}{" "}
                                                        of{" "}
                                                        {
                                                            tablePagination.lastPage
                                                        }
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                loadTableRecords(
                                                                    selectedTable,
                                                                    tablePagination.page -
                                                                        1,
                                                                )
                                                            }
                                                            disabled={
                                                                tablePagination.page <=
                                                                1
                                                            }
                                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                loadTableRecords(
                                                                    selectedTable,
                                                                    tablePagination.page +
                                                                        1,
                                                                )
                                                            }
                                                            disabled={
                                                                tablePagination.page >=
                                                                tablePagination.lastPage
                                                            }
                                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
