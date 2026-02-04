import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";

interface LegoModelAdmin {
    id: number;
    name: string;
    description: string | null;
    file_name: string | null;
    total_steps: number;
    total_parts: number;
    is_public: boolean;
    price: string | null;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
}

interface PaginatedModels {
    data: LegoModelAdmin[];
    current_page: number;
    last_page: number;
    total: number;
}

function getCsrfToken(): string {
    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (metaToken) return metaToken;
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    if (cookie) return decodeURIComponent(cookie.split("=")[1]);
    return "";
}

export default function AdminModels() {
    const { user, isAdmin, isMod } = useAuth();
    const [models, setModels] = useState<PaginatedModels | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = async (page = 1, search = "") => {
        try {
            // Ensure CSRF cookie is set for Sanctum
            await fetch("/sanctum/csrf-cookie", { credentials: "same-origin" });

            const params = new URLSearchParams({ page: String(page) });
            if (search) params.set("search", search);

            const response = await fetch(`/api/admin/models?${params}`, {
                headers: {
                    Accept: "application/json",
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            });
            if (response.ok) {
                setModels(await response.json());
            } else {
                console.error(
                    "Failed to fetch models:",
                    response.status,
                    response.statusText,
                );
            }
        } catch (err) {
            console.error("Failed to fetch models:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleToggleModelVisibility = async (
        modelId: number,
        isPublic: boolean,
    ) => {
        try {
            const response = await fetch(`/api/admin/models/${modelId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({ is_public: isPublic }),
            });

            if (response.ok) {
                await fetchModels(models?.current_page, searchQuery);
            }
        } catch (err) {
            setError("Failed to update model");
        }
    };

    const handleDeleteModel = async (modelId: number) => {
        if (!confirm("Are you sure you want to delete this model?")) return;

        try {
            const response = await fetch(`/api/admin/models/${modelId}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            });

            if (response.ok) {
                await fetchModels(models?.current_page, searchQuery);
            }
        } catch (err) {
            setError("Failed to delete model");
        }
    };

    if (!isAdmin && !isMod) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Access Denied
                    </h1>
                    <p className="text-gray-400 mb-4">
                        You do not have permission to access this page.
                    </p>
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
                    <AdminNav currentPage="models" />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Model Management
                        </h1>
                        <p className="text-gray-400">
                            Manage submitted LEGO models
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-between">
                            <span>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-300 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">
                                    Loading models...
                                </p>
                            </div>
                        </div>
                    ) : models ? (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-700">
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchModels(1, e.target.value);
                                    }}
                                    className="w-full max-w-md bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                            Model
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                            Owner
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                            Status
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                            Price
                                        </th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {models.data.map((model) => (
                                        <tr
                                            key={model.id}
                                            className="hover:bg-gray-700/30"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white">
                                                    {model.name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {model.total_steps} steps •{" "}
                                                    {model.total_parts} parts
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {model.user?.name ||
                                                    "Anonymous"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() =>
                                                        handleToggleModelVisibility(
                                                            model.id,
                                                            !model.is_public,
                                                        )
                                                    }
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        model.is_public
                                                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                                            : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                                                    }`}
                                                >
                                                    {model.is_public
                                                        ? "Public"
                                                        : "Private"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {model.price &&
                                                parseFloat(model.price) > 0
                                                    ? `$${model.price}`
                                                    : "Free"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteModel(
                                                            model.id,
                                                        )
                                                    }
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {models.last_page > 1 && (
                                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                                    <span className="text-sm text-gray-400">
                                        Page {models.current_page} of{" "}
                                        {models.last_page} ({models.total}{" "}
                                        models)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                fetchModels(
                                                    models.current_page - 1,
                                                    searchQuery,
                                                )
                                            }
                                            disabled={models.current_page === 1}
                                            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() =>
                                                fetchModels(
                                                    models.current_page + 1,
                                                    searchQuery,
                                                )
                                            }
                                            disabled={
                                                models.current_page ===
                                                models.last_page
                                            }
                                            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
