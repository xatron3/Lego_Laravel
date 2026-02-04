import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";

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

export default function AdminDashboard() {
    const { user, isAdmin, isMod } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
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
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

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
                    <AdminNav currentPage="dashboard" />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-400">
                            Platform statistics overview
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">
                                    Loading statistics...
                                </p>
                            </div>
                        </div>
                    ) : stats ? (
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
                    ) : null}
                </div>
            </div>
        </div>
    );
}
