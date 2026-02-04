import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";
import { api } from "../api";

export default function AdminDataImport() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
        if (isAuthenticated && isAdmin) {
            loadRebrickableStats();
            loadRebrickableTables();
        }
    }, [isAuthenticated, isAdmin]);

    const loadRebrickableStats = async () => {
        try {
            const stats = await api.getRebrickableStats();
            setRebrickableStats(stats);
        } catch (error) {
            console.error("Failed to load stats:", error);
        }
    };

    const loadRebrickableTables = async () => {
        try {
            const tables = await api.getRebrickableTables();
            setRebrickableTables(tables);
        } catch (error) {
            console.error("Failed to load tables:", error);
        }
    };

    const loadTableRecords = async (table: string, page = 1, search = "") => {
        setTableLoading(true);
        try {
            const data = await api.getRebrickableRecords(table, {
                page,
                search,
                per_page: 20,
            });
            setTableRecords(data.data);
            setTablePagination({
                page: data.current_page,
                lastPage: data.last_page,
                total: data.total,
            });
        } catch (error) {
            console.error("Failed to load table records:", error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleImportTable = async (table: string) => {
        setImportingTable(table);
        try {
            const result = await api.importRebrickableTable(table);
            alert(
                result.message ||
                    `Imported ${result.imported} records for ${table}`,
            );
            await loadRebrickableStats();
        } catch (error) {
            console.error("Failed to import table:", error);
            alert("Failed to import table");
        } finally {
            setImportingTable(null);
        }
    };

    const handleImportAll = async () => {
        setImportingAll(true);
        setImportResults(null);
        try {
            const result = await api.importAllRebrickableTables();
            setImportResults({
                results: result.results,
                errors: result.errors,
            });
            await loadRebrickableStats();
        } catch (error) {
            console.error("Failed to import all:", error);
            alert("Failed to import all tables");
        } finally {
            setImportingAll(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear all Rebrickable data?")) {
            return;
        }
        try {
            await api.clearAllRebrickableTables();
            alert("All data cleared successfully");
            await loadRebrickableStats();
            setSelectedTable(null);
        } catch (error) {
            console.error("Failed to clear all:", error);
            alert("Failed to clear all data");
        }
    };

    const handleClearTable = async (table: string) => {
        if (!confirm(`Are you sure you want to clear ${table}?`)) {
            return;
        }
        try {
            await api.clearRebrickableTable(table);
            alert(`${table} cleared successfully`);
            await loadRebrickableStats();
            if (selectedTable === table) {
                setSelectedTable(null);
            }
        } catch (error) {
            console.error("Failed to clear table:", error);
            alert("Failed to clear table");
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
                    <AdminNav currentPage="data-import" />

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Rebrickable Data Import
                        </h1>
                        <p className="text-gray-400">
                            Manage LEGO parts and sets database
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Import All Section */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Bulk Import
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Import all CSV files from the data
                                        folder at once. Files should be placed
                                        in{" "}
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
                                    <h4 className="text-white font-medium mb-2">
                                        Import Results
                                    </h4>
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
                                    {Object.keys(importResults.errors).length >
                                        0 && (
                                        <div className="mt-2">
                                            <h5 className="text-red-400 font-medium mb-1">
                                                Errors
                                            </h5>
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
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Database Statistics
                            </h3>
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
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Individual Table Import
                            </h3>
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
                                                        {info.has_file ? (
                                                            <span className="text-green-400">
                                                                ✓ File exists
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-400">
                                                                ✗ No file
                                                            </span>
                                                        )}
                                                        {" • "}
                                                        {rebrickableStats[
                                                            table
                                                        ]?.toLocaleString() ||
                                                            0}{" "}
                                                        records
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTable(
                                                            selectedTable ===
                                                                table
                                                                ? null
                                                                : table,
                                                        );
                                                        if (
                                                            selectedTable !==
                                                            table
                                                        ) {
                                                            loadTableRecords(
                                                                table,
                                                            );
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                                >
                                                    {selectedTable === table
                                                        ? "Hide"
                                                        : "View"}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleImportTable(table)
                                                    }
                                                    disabled={
                                                        !info.has_file ||
                                                        importingTable === table
                                                    }
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {importingTable === table
                                                        ? "..."
                                                        : "Import"}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleClearTable(table)
                                                    }
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Table Records Viewer */}
                        {selectedTable && (
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedTable} Records
                                    </h3>
                                    <input
                                        type="text"
                                        value={tableSearch}
                                        onChange={(e) => {
                                            setTableSearch(e.target.value);
                                            loadTableRecords(
                                                selectedTable,
                                                1,
                                                e.target.value,
                                            );
                                        }}
                                        placeholder="Search..."
                                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                {tableLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-700">
                                                        {rebrickableTables[
                                                            selectedTable
                                                        ]?.columns.map(
                                                            (col) => (
                                                                <th
                                                                    key={col}
                                                                    className="text-left py-2 px-3 text-gray-400 text-sm"
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
                                                                className="border-b border-gray-700/50"
                                                            >
                                                                {rebrickableTables[
                                                                    selectedTable
                                                                ]?.columns.map(
                                                                    (col) => (
                                                                        <td
                                                                            key={
                                                                                col
                                                                            }
                                                                            className="py-2 px-3 text-gray-300 text-sm"
                                                                        >
                                                                            {String(
                                                                                record[
                                                                                    col
                                                                                ] ||
                                                                                    "",
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
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-gray-400">
                                                Showing {tableRecords.length} of{" "}
                                                {tablePagination.total} records
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        loadTableRecords(
                                                            selectedTable,
                                                            tablePagination.page -
                                                                1,
                                                            tableSearch,
                                                        )
                                                    }
                                                    disabled={
                                                        tablePagination.page ===
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
                                                            tableSearch,
                                                        )
                                                    }
                                                    disabled={
                                                        tablePagination.page ===
                                                        tablePagination.lastPage
                                                    }
                                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
