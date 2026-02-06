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
    const [activeJobId, setActiveJobId] = useState<string | null>(null); // Used to track current import job
    const [jobProgress, setJobProgress] = useState<{
        status: string;
        progress: number | null;
        message: string;
        table?: string;
        stats?: {
            total: number;
            processed: number;
            imported: number;
            skipped: number;
        };
    } | null>(null);
    const [importResults, setImportResults] = useState<{
        results: Record<string, number>;
        errors: Record<string, string>;
    } | null>(null);
    const [importJobs, setImportJobs] = useState<
        Array<{
            job_id: string;
            status: string;
            progress: number | null;
            message: string;
            table?: string;
            stats?: {
                total: number;
                processed: number;
                imported: number;
                skipped: number;
            };
            updated_at: string;
        }>
    >([]);

    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            loadRebrickableStats();
            loadRebrickableTables();
            loadImportJobs();
        }
    }, [isAuthenticated, isAdmin]);

    const loadRebrickableStats = async () => {
        try {
            const stats = await api.getRebrickableStats();
            setRebrickableStats(stats || {});
        } catch (error) {
            console.error("Failed to load stats:", error);
            setRebrickableStats({});
        }
    };

    const loadRebrickableTables = async () => {
        try {
            const tables = await api.getRebrickableTables();
            setRebrickableTables(tables || {});
        } catch (error) {
            console.error("Failed to load tables:", error);
            setRebrickableTables({});
        }
    };

    const loadImportJobs = async () => {
        try {
            const jobs = await api.getRebrickableJobs();
            setImportJobs(jobs || []);
        } catch (error) {
            console.error("Failed to load jobs:", error);
            setImportJobs([]);
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
        setJobProgress(null);
        try {
            const result = await api.importRebrickableTable(table);

            if (result.job_id) {
                // New job-based import
                setActiveJobId(result.job_id);
                pollJobProgress(result.job_id);
            } else {
                // Old synchronous import (fallback)
                alert(
                    result.message ||
                        `Imported ${result.imported} records for ${table}`,
                );
                await loadRebrickableStats();
                setImportingTable(null);
            }
        } catch (error) {
            console.error("Failed to import table:", error);
            alert("Failed to import table");
            setImportingTable(null);
        }
    };

    const handleImportAll = async () => {
        setImportingAll(true);
        setImportResults(null);
        setJobProgress(null);
        try {
            const result = await api.importAllRebrickableTables();

            if (result.job_id) {
                // New job-based import
                setActiveJobId(result.job_id);
                pollJobProgress(result.job_id);
            } else {
                // Old synchronous import (fallback)
                setImportResults({
                    results: result.results || {},
                    errors: result.errors || {},
                });
                await loadRebrickableStats();
                setImportingAll(false);
            }
        } catch (error) {
            console.error("Failed to import all:", error);
            alert("Failed to import all tables");
            setImportingAll(false);
        }
    };

    const pollJobProgress = async (jobId: string) => {
        const interval = setInterval(async () => {
            try {
                const progress = await api.getRebrickableJobProgress(jobId);
                setJobProgress(progress);

                if (progress.status === "completed") {
                    clearInterval(interval);
                    setImportingAll(false);
                    setImportingTable(null);
                    setActiveJobId(null);
                    await loadRebrickableStats();
                    await loadImportJobs();
                    alert("Import completed successfully!");
                } else if (progress.status === "failed") {
                    clearInterval(interval);
                    setImportingAll(false);
                    setImportingTable(null);
                    setActiveJobId(null);
                    await loadImportJobs();
                    alert("Import failed: " + progress.message);
                }
            } catch (error) {
                console.error("Failed to fetch job progress:", error);
            }
        }, 2000); // Poll every 2 seconds
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

    const handleRetryJob = async (jobId: string) => {
        try {
            const result = await api.retryRebrickableJob(jobId);
            setActiveJobId(result.job_id);
            pollJobProgress(result.job_id);
            await loadImportJobs();
        } catch (error) {
            console.error("Failed to retry job:", error);
            alert("Failed to retry job");
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

                            {/* Import Results/Progress */}
                            {jobProgress && (
                                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                                    <h4 className="text-white font-medium mb-2">
                                        Import Progress
                                        {activeJobId && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                (Job: {activeJobId})
                                            </span>
                                        )}
                                    </h4>
                                    <div className="mb-2">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">
                                                Status: {jobProgress.status}
                                            </span>
                                            {jobProgress.progress !== null && (
                                                <span className="text-yellow-400">
                                                    {Math.round(
                                                        jobProgress.progress,
                                                    )}
                                                    %
                                                </span>
                                            )}
                                        </div>
                                        {jobProgress.progress !== null && (
                                            <div className="w-full bg-gray-600 rounded-full h-2">
                                                <div
                                                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${jobProgress.progress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">
                                        {jobProgress.message}
                                    </p>
                                    {jobProgress.stats && (
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div className="bg-gray-600 p-2 rounded">
                                                <div className="text-gray-400">
                                                    Total
                                                </div>
                                                <div className="text-white font-medium">
                                                    {jobProgress.stats.total.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-600 p-2 rounded">
                                                <div className="text-gray-400">
                                                    Processed
                                                </div>
                                                <div className="text-white font-medium">
                                                    {jobProgress.stats.processed.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-600 p-2 rounded">
                                                <div className="text-gray-400">
                                                    Imported
                                                </div>
                                                <div className="text-green-400 font-medium">
                                                    {jobProgress.stats.imported.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-600 p-2 rounded">
                                                <div className="text-gray-400">
                                                    Skipped
                                                </div>
                                                <div className="text-yellow-400 font-medium">
                                                    {jobProgress.stats.skipped.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {importResults && (
                                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                                    <h4 className="text-white font-medium mb-2">
                                        Import Results
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        {Object.entries(
                                            importResults.results || {},
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
                                    {Object.keys(importResults.errors || {})
                                        .length > 0 && (
                                        <div className="mt-2">
                                            <h5 className="text-red-400 font-medium mb-1">
                                                Errors
                                            </h5>
                                            {Object.entries(
                                                importResults.errors || {},
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

                        {/* Job History */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Import Job History
                            </h3>
                            {importJobs.length === 0 ? (
                                <p className="text-gray-400 text-center py-4">
                                    No import jobs yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {importJobs.map((job) => (
                                        <div
                                            key={job.job_id}
                                            className="p-4 bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            job.status ===
                                                            "completed"
                                                                ? "bg-green-900 text-green-300"
                                                                : job.status ===
                                                                    "failed"
                                                                  ? "bg-red-900 text-red-300"
                                                                  : job.status ===
                                                                      "processing"
                                                                    ? new Date().getTime() -
                                                                          new Date(
                                                                              job.updated_at,
                                                                          ).getTime() >
                                                                      300000
                                                                        ? "bg-orange-900 text-orange-300"
                                                                        : "bg-blue-900 text-blue-300"
                                                                    : "bg-gray-600 text-gray-300"
                                                        }`}
                                                    >
                                                        {job.status ===
                                                            "processing" &&
                                                        new Date().getTime() -
                                                            new Date(
                                                                job.updated_at,
                                                            ).getTime() >
                                                            300000
                                                            ? "stuck"
                                                            : job.status}
                                                    </span>
                                                    <span className="text-white font-medium">
                                                        {job.table ||
                                                            "All Tables"}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">
                                                        {new Date(
                                                            job.updated_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                {(job.status === "failed" ||
                                                    (job.status ===
                                                        "processing" &&
                                                        new Date().getTime() -
                                                            new Date(
                                                                job.updated_at,
                                                            ).getTime() >
                                                            300000)) && (
                                                    <button
                                                        onClick={() =>
                                                            handleRetryJob(
                                                                job.job_id,
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded transition-colors"
                                                    >
                                                        {job.status === "failed"
                                                            ? "Retry"
                                                            : "Retry (Stuck)"}
                                                    </button>
                                                )}
                                            </div>
                                            {job.progress !== null && (
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-400">
                                                            Progress
                                                        </span>
                                                        <span className="text-yellow-400">
                                                            {Math.round(
                                                                job.progress,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                                                        <div
                                                            className="bg-yellow-500 h-1.5 rounded-full"
                                                            style={{
                                                                width: `${job.progress}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-gray-300 text-sm">
                                                {job.message}
                                            </p>
                                            {job.stats && (
                                                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                                                    <div className="bg-gray-600 p-2 rounded">
                                                        <div className="text-gray-400">
                                                            Total
                                                        </div>
                                                        <div className="text-white font-medium">
                                                            {job.stats.total.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-600 p-2 rounded">
                                                        <div className="text-gray-400">
                                                            Processed
                                                        </div>
                                                        <div className="text-white font-medium">
                                                            {job.stats.processed.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-600 p-2 rounded">
                                                        <div className="text-gray-400">
                                                            Imported
                                                        </div>
                                                        <div className="text-green-400 font-medium">
                                                            {job.stats.imported.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-600 p-2 rounded">
                                                        <div className="text-gray-400">
                                                            Skipped
                                                        </div>
                                                        <div className="text-yellow-400 font-medium">
                                                            {job.stats.skipped.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
