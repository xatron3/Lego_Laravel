import { useState, useEffect } from "react";
import { useAuth, User } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";

interface PaginatedUsers {
    data: (User & { mocs_count: number })[];
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

export default function AdminUsers() {
    const { user, isAdmin, isLoading: authLoading } = useAuth();
    const [users, setUsers] = useState<PaginatedUsers | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (page = 1, search = "") => {
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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
                await fetchUsers(users?.current_page, searchQuery);
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
                await fetchUsers(users?.current_page, searchQuery);
            } else {
                const err = await response.json();
                setError(err.message);
            }
        } catch (err) {
            setError("Failed to delete user");
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
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
                    <AdminNav currentPage="users" />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            User Management
                        </h1>
                        <p className="text-gray-400">
                            Manage user accounts and roles
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
                                    Loading users...
                                </p>
                            </div>
                        </div>
                    ) : users ? (
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
                                                    disabled={u.id === user?.id}
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
                                                        handleDeleteUser(u.id)
                                                    }
                                                    disabled={u.id === user?.id}
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
                                        {users.last_page} ({users.total} users)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                fetchUsers(
                                                    users.current_page - 1,
                                                    searchQuery,
                                                )
                                            }
                                            disabled={users.current_page === 1}
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
                    ) : null}
                </div>
            </div>
        </div>
    );
}
