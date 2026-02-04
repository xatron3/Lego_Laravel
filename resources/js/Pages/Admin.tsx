import { useState, useEffect, useCallback } from "react";
import { useAuth, User } from "../contexts/AuthContext";

interface Stats {
    users: {
        total: number;
        by_role: {
            normal: number;
            submitter: number;
            mod: number;
            admin: number;
        };
    };
    models: {
        total: number;
        public: number;
        private: number;
        paid: number;
    };
}

interface PaginatedUsers {
    data: (User & { mocs_count: number })[];
    current_page: number;
    last_page: number;
    total: number;
}

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

export default function Admin() {
    const { user, isAdmin, isMod } = useAuth();
    const [activeTab, setActiveTab] = useState<
        "dashboard" | "users" | "models"
    >("dashboard");
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<PaginatedUsers | null>(null);
    const [models, setModels] = useState<PaginatedModels | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/stats", {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            if (response.ok) {
                setStats(await response.json());
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    }, []);

    const fetchUsers = useCallback(async (page = 1, search = "") => {
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (search) params.set("search", search);

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            if (response.ok) {
                setUsers(await response.json());
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    }, []);

    const fetchModels = useCallback(async (page = 1, search = "") => {
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (search) params.set("search", search);

            const response = await fetch(`/api/admin/models?${params}`, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            if (response.ok) {
                setModels(await response.json());
            }
        } catch (err) {
            console.error("Failed to fetch models:", err);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await fetchStats();
            await fetchUsers();
            await fetchModels();
            setIsLoading(false);
        };
        init();
    }, [fetchStats, fetchUsers, fetchModels]);

    const handleUpdateRole = async (userId: number, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                await fetchUsers();
                await fetchStats();
            } else {
                const err = await response.json();
                setError(err.message);
            }
        } catch (err) {
            setError("Failed to update user role");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            });

            if (response.ok) {
                await fetchUsers();
                await fetchStats();
            } else {
                const err = await response.json();
                setError(err.message);
            }
        } catch (err) {
            setError("Failed to delete user");
        }
    };

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
                await fetchModels();
                await fetchStats();
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
                await fetchModels();
                await fetchStats();
            }
        } catch (err) {
            setError("Failed to delete model");
        }
    };

    if (!isAdmin && !isMod) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-400">
                        You don't have permission to access this page.
                    </p>
                    <a
                        href="/"
                        className="mt-4 inline-block text-yellow-400 hover:text-yellow-300"
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a
                            href="/"
                            className="text-2xl font-bold text-yellow-400"
                        >
                            LEGO LDraw Studio
                        </a>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-300">Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                            {user?.name}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/50">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                {/* Error Alert */}
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

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {["dashboard", "users", "models"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() =>
                                setActiveTab(tab as typeof activeTab)
                            }
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}

                    {/* Links to separate admin pages */}
                    <div className="ml-auto flex gap-2">
                        <a
                            href="/admin/sales"
                            className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                        >
                            💰 Sales
                        </a>
                        <a
                            href="/admin/data-import"
                            className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-500 transition-colors"
                        >
                            📦 Data Import
                        </a>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <>
                        {/* Dashboard */}
                        {activeTab === "dashboard" && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                                        Total Users
                                    </h3>
                                    <p className="text-3xl font-bold text-white">
                                        {stats.users.total}
                                    </p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                                        Total Models
                                    </h3>
                                    <p className="text-3xl font-bold text-white">
                                        {stats.models.total}
                                    </p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                                        Public Models
                                    </h3>
                                    <p className="text-3xl font-bold text-green-400">
                                        {stats.models.public}
                                    </p>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                                        Paid Models
                                    </h3>
                                    <p className="text-3xl font-bold text-yellow-400">
                                        {stats.models.paid}
                                    </p>
                                </div>

                                {/* User breakdown */}
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 md:col-span-2">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Users by Role
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className="text-gray-300">
                                                Normal
                                            </span>
                                            <span className="font-semibold text-white">
                                                {stats.users.by_role.normal}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className="text-blue-400">
                                                Submitter
                                            </span>
                                            <span className="font-semibold text-white">
                                                {stats.users.by_role.submitter}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className="text-purple-400">
                                                Mod
                                            </span>
                                            <span className="font-semibold text-white">
                                                {stats.users.by_role.mod}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className="text-red-400">
                                                Admin
                                            </span>
                                            <span className="font-semibold text-white">
                                                {stats.users.by_role.admin}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === "users" && users && isAdmin && (
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-700">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            fetchUsers(1, e.target.value);
                                        }}
                                        className="w-full max-w-md bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    />
                                </div>
                                <table className="w-full">
                                    <thead className="bg-gray-700/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                                User
                                            </th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                                Role
                                            </th>
                                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                                Models
                                            </th>
                                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {users.data.map((u) => (
                                            <tr
                                                key={u.id}
                                                className="hover:bg-gray-700/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white">
                                                        {u.name}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {u.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) =>
                                                            handleUpdateRole(
                                                                u.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            u.id === user?.id
                                                        }
                                                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                                                    >
                                                        <option value="normal">
                                                            Normal
                                                        </option>
                                                        <option value="submitter">
                                                            Submitter
                                                        </option>
                                                        <option value="mod">
                                                            Mod
                                                        </option>
                                                        <option value="admin">
                                                            Admin
                                                        </option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300">
                                                    {u.mocs_count}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteUser(
                                                                u.id,
                                                            )
                                                        }
                                                        disabled={
                                                            u.id === user?.id
                                                        }
                                                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.last_page > 1 && (
                                    <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                                        <span className="text-sm text-gray-400">
                                            Page {users.current_page} of{" "}
                                            {users.last_page} ({users.total}{" "}
                                            users)
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    fetchUsers(
                                                        users.current_page - 1,
                                                        searchQuery,
                                                    )
                                                }
                                                disabled={
                                                    users.current_page === 1
                                                }
                                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                            >
                                                Prev
                                            </button>
                                            <button
                                                onClick={() =>
                                                    fetchUsers(
                                                        users.current_page + 1,
                                                        searchQuery,
                                                    )
                                                }
                                                disabled={
                                                    users.current_page ===
                                                    users.last_page
                                                }
                                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Models Tab */}
                        {activeTab === "models" && models && (
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
                                                        {model.total_steps}{" "}
                                                        steps •{" "}
                                                        {model.total_parts}{" "}
                                                        parts
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
                                                disabled={
                                                    models.current_page === 1
                                                }
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
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
