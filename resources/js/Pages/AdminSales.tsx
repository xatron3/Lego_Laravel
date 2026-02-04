import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";
import { api } from "../api";

interface AdminSalesData {
    total_sales: number;
    total_revenue: number;
    platform_revenue: number;
    recent_sales: Array<{
        id: number;
        buyer_name: string;
        seller_name: string;
        model_name: string;
        total: string;
        platform_fee: string;
        created_at: string;
    }>;
}

export default function AdminSales() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [salesData, setSalesData] = useState<AdminSalesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            loadSalesData();
        }
    }, [isAuthenticated, isAdmin]);

    const loadSalesData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getAdminSales();
            setSalesData(data);
        } catch (err) {
            console.error("Failed to load sales data:", err);
            setError("Failed to load sales data");
        } finally {
            setIsLoading(false);
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Please sign in to access this page
                    </h1>
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
                    <AdminNav currentPage="sales" />

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Sales Analytics
                        </h1>
                        <p className="text-gray-400">
                            Platform sales overview and revenue tracking
                        </p>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">
                                    Loading sales data...
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={loadSalesData}
                                className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Retry
                            </button>
                        </div>
                    ) : salesData ? (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-linear-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium text-blue-400">
                                            Total Sales
                                        </h3>
                                        <svg
                                            className="w-6 h-6 text-blue-500"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {salesData.total_sales}
                                    </p>
                                </div>

                                <div className="bg-linear-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium text-green-400">
                                            Total Revenue
                                        </h3>
                                        <svg
                                            className="w-6 h-6 text-green-500"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        ${salesData.total_revenue.toFixed(2)}
                                    </p>
                                </div>

                                <div className="bg-linear-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium text-yellow-400">
                                            Platform Revenue (5%)
                                        </h3>
                                        <svg
                                            className="w-6 h-6 text-yellow-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        ${salesData.platform_revenue.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Recent Sales Table */}
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h2 className="text-lg font-bold text-white mb-4">
                                    Recent Sales
                                </h2>
                                {salesData.recent_sales.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        No sales yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                        Date
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                        Buyer
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                        Seller
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                                        Model
                                                    </th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                                        Total
                                                    </th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                                        Platform Fee
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesData.recent_sales.map(
                                                    (sale) => (
                                                        <tr
                                                            key={sale.id}
                                                            className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-gray-300">
                                                                {new Date(
                                                                    sale.created_at,
                                                                ).toLocaleDateString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-white">
                                                                {
                                                                    sale.buyer_name
                                                                }
                                                            </td>
                                                            <td className="py-3 px-4 text-white">
                                                                {
                                                                    sale.seller_name
                                                                }
                                                            </td>
                                                            <td className="py-3 px-4 text-white">
                                                                {
                                                                    sale.model_name
                                                                }
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-green-400 font-medium">
                                                                $
                                                                {Number(
                                                                    sale.total,
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-yellow-400 font-medium">
                                                                $
                                                                {Number(
                                                                    sale.platform_fee,
                                                                ).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
