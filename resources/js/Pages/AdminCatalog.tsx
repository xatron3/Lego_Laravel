import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";
import { api } from "../api";

type EntityType = "sets" | "parts" | "minifigs" | "themes";

interface EntityField {
    key: string;
    label: string;
    type: "text" | "number" | "select";
    required?: boolean;
    placeholder?: string;
}

const ENTITY_CONFIG: Record<
    EntityType,
    {
        label: string;
        primaryKey: string;
        fields: EntityField[];
        getSubtitle: (item: any) => string;
    }
> = {
    sets: {
        label: "Sets",
        primaryKey: "set_num",
        fields: [
            {
                key: "set_num",
                label: "Set Number",
                type: "text",
                required: true,
                placeholder: "e.g. 75192-1",
            },
            {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Set name",
            },
            {
                key: "year",
                label: "Year",
                type: "number",
                required: true,
                placeholder: "2024",
            },
            {
                key: "theme_id",
                label: "Theme ID",
                type: "number",
                required: true,
                placeholder: "Theme ID",
            },
            {
                key: "num_parts",
                label: "Parts",
                type: "number",
                required: true,
                placeholder: "0",
            },
        ],
        getSubtitle: (item) =>
            `${item.set_num} · ${item.year ?? ""} · ${item.num_parts ?? 0} pcs${item.theme?.name ? ` · ${item.theme.name}` : ""}`,
    },
    parts: {
        label: "Parts",
        primaryKey: "part_num",
        fields: [
            {
                key: "part_num",
                label: "Part Number",
                type: "text",
                required: true,
                placeholder: "e.g. 3001",
            },
            {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Part name",
            },
            {
                key: "part_cat_id",
                label: "Category ID",
                type: "number",
                required: true,
                placeholder: "Category ID",
            },
        ],
        getSubtitle: (item) =>
            `${item.part_num}${item.category?.name ? ` · ${item.category.name}` : ""}`,
    },
    minifigs: {
        label: "Minifigs",
        primaryKey: "fig_num",
        fields: [
            {
                key: "fig_num",
                label: "Figure Number",
                type: "text",
                required: true,
                placeholder: "e.g. fig-000001",
            },
            {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Minifig name",
            },
            {
                key: "num_parts",
                label: "Parts",
                type: "number",
                required: true,
                placeholder: "0",
            },
        ],
        getSubtitle: (item) => `${item.fig_num} · ${item.num_parts ?? 0} pcs`,
    },
    themes: {
        label: "Themes",
        primaryKey: "id",
        fields: [
            {
                key: "id",
                label: "ID",
                type: "number",
                required: true,
                placeholder: "Theme ID",
            },
            {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Theme name",
            },
            {
                key: "parent_id",
                label: "Parent ID",
                type: "number",
                placeholder: "Parent theme ID (optional)",
            },
        ],
        getSubtitle: (item) =>
            `ID: ${item.id}${item.parent?.name ? ` · Parent: ${item.parent.name}` : ""}${item.sets_count !== undefined ? ` · ${item.sets_count} sets` : ""}`,
    },
};

interface CatalogStats {
    sets: number;
    parts: number;
    minifigs: number;
    themes: number;
    sets_with_custom_image: number;
    parts_with_custom_image: number;
    minifigs_with_custom_image: number;
    themes_with_custom_image: number;
}

export default function AdminCatalog() {
    const { isAdmin, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<EntityType>("sets");
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        lastPage: 1,
        total: 0,
        perPage: 25,
    });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [formLoading, setFormLoading] = useState(false);

    // Image upload
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = ENTITY_CONFIG[activeTab];

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.getAdminCatalogStats();
            setStats(data);
        } catch {
            // ignore
        }
    }, []);

    const fetchRecords = useCallback(
        async (page = 1) => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getAdminCatalogRecords(activeTab, {
                    search: search || undefined,
                    page,
                    per_page: pagination.perPage,
                });
                setRecords(data.data);
                setPagination((prev) => ({
                    ...prev,
                    page: data.current_page,
                    lastPage: data.last_page,
                    total: data.total,
                }));
            } catch (err: any) {
                setError(err.message || "Failed to fetch records");
            } finally {
                setIsLoading(false);
            }
        },
        [activeTab, search, pagination.perPage],
    );

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchRecords(1);
    }, [activeTab]);

    useEffect(() => {
        const timeout = setTimeout(() => fetchRecords(1), 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const showSuccessMessage = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    // Create
    const openCreateModal = () => {
        clearMessages();
        const initial: Record<string, any> = {};
        config.fields.forEach((f) => (initial[f.key] = ""));
        setFormData(initial);
        setShowCreateModal(true);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        clearMessages();
        try {
            const submitData = { ...formData };
            config.fields.forEach((f) => {
                if (f.type === "number" && submitData[f.key] !== "") {
                    submitData[f.key] = Number(submitData[f.key]);
                }
                if (!f.required && submitData[f.key] === "") {
                    submitData[f.key] = null;
                }
            });
            await api.createAdminCatalogRecord(activeTab, submitData);
            setShowCreateModal(false);
            showSuccessMessage("Record created successfully");
            fetchRecords(pagination.page);
            fetchStats();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    // Edit
    const openEditModal = (record: any) => {
        clearMessages();
        const data: Record<string, any> = {};
        config.fields.forEach((f) => (data[f.key] = record[f.key] ?? ""));
        setFormData(data);
        setEditingRecord(record);
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editingRecord) return;
        setFormLoading(true);
        clearMessages();
        try {
            const pk = config.primaryKey;
            const submitData: Record<string, any> = {};
            config.fields.forEach((f) => {
                if (f.key === pk) return; // Don't update primary key
                let val = formData[f.key];
                if (f.type === "number" && val !== "" && val != null) {
                    val = Number(val);
                }
                if (!f.required && (val === "" || val == null)) {
                    val = null;
                }
                submitData[f.key] = val;
            });
            await api.updateAdminCatalogRecord(
                activeTab,
                String(editingRecord[pk]),
                submitData,
            );
            setShowEditModal(false);
            setEditingRecord(null);
            showSuccessMessage("Record updated successfully");
            fetchRecords(pagination.page);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    // Delete
    const handleDelete = async (record: any) => {
        const pk = config.primaryKey;
        const id = record[pk];
        if (
            !confirm(
                `Are you sure you want to delete "${record.name || id}"? This cannot be undone.`,
            )
        )
            return;

        clearMessages();
        try {
            await api.deleteAdminCatalogRecord(activeTab, String(id));
            showSuccessMessage("Record deleted successfully");
            fetchRecords(pagination.page);
            fetchStats();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Image upload
    const handleImageUpload = async (record: any, file: File) => {
        const pk = config.primaryKey;
        const id = String(record[pk]);
        setUploadingId(id);
        clearMessages();
        try {
            await api.uploadAdminCatalogImage(activeTab, id, file);
            showSuccessMessage("Image uploaded successfully");
            fetchRecords(pagination.page);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingId(null);
        }
    };

    const handleImageDelete = async (record: any) => {
        const pk = config.primaryKey;
        const id = String(record[pk]);
        if (
            !confirm(
                "Remove custom image? The Rebrickable fallback will be used.",
            )
        )
            return;

        clearMessages();
        try {
            await api.deleteAdminCatalogImage(activeTab, id);
            showSuccessMessage("Custom image removed");
            fetchRecords(pagination.page);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const triggerFileInput = (record: any) => {
        const pk = config.primaryKey;
        setUploadingId(String(record[pk]));
        fileInputRef.current?.click();
    };

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingId) return;

        const record = records.find(
            (r) => String(r[config.primaryKey]) === uploadingId,
        );
        if (record) {
            handleImageUpload(record, file);
        }
        e.target.value = "";
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-white mb-6">
                    Catalog Management
                </h1>

                <AdminNav currentPage="catalog" />

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {(["sets", "parts", "minifigs", "themes"] as const).map(
                            (type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setActiveTab(type);
                                        setSearch("");
                                    }}
                                    className={`p-4 rounded-lg text-left transition-colors ${
                                        activeTab === type
                                            ? "bg-yellow-500 text-gray-900"
                                            : "bg-gray-800 text-white hover:bg-gray-700"
                                    }`}
                                >
                                    <div className="text-2xl font-bold">
                                        {stats[type]?.toLocaleString() ?? 0}
                                    </div>
                                    <div
                                        className={`text-sm ${activeTab === type ? "text-gray-700" : "text-gray-400"}`}
                                    >
                                        {ENTITY_CONFIG[type].label}
                                    </div>
                                    {(stats as any)[
                                        `${type}_with_custom_image`
                                    ] > 0 && (
                                        <div
                                            className={`text-xs mt-1 ${activeTab === type ? "text-gray-600" : "text-yellow-500"}`}
                                        >
                                            {
                                                (stats as any)[
                                                    `${type}_with_custom_image`
                                                ]
                                            }{" "}
                                            custom images
                                        </div>
                                    )}
                                </button>
                            ),
                        )}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={`Search ${config.label.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                        + Add {config.label.slice(0, -1)}
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="float-right text-red-400 hover:text-red-200"
                        >
                            ×
                        </button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300">
                        {success}
                    </div>
                )}

                {/* Hidden file input for image uploads */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFileSelected}
                />

                {/* Records Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            No {config.label.toLowerCase()} found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700 text-left text-gray-400 text-sm">
                                        <th className="px-4 py-3 w-16">
                                            Image
                                        </th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 w-20">
                                            Custom
                                        </th>
                                        <th className="px-4 py-3 w-40 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => {
                                        const pk = config.primaryKey;
                                        const id = String(record[pk]);
                                        const hasCustomImage =
                                            !!record.custom_image;

                                        return (
                                            <tr
                                                key={id}
                                                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                            >
                                                {/* Image */}
                                                <td className="px-4 py-3">
                                                    <div className="w-12 h-12 rounded bg-gray-700 overflow-hidden flex items-center justify-center">
                                                        {record.image_url ? (
                                                            <img
                                                                src={
                                                                    record.image_url
                                                                }
                                                                alt={
                                                                    record.name
                                                                }
                                                                className="w-full h-full object-contain"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    (
                                                                        e.target as HTMLImageElement
                                                                    ).style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg
                                                                className="w-6 h-6 text-gray-500"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Name */}
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-medium text-sm truncate max-w-xs">
                                                        {record.name}
                                                    </div>
                                                </td>

                                                {/* Details */}
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-400 text-sm">
                                                        {config.getSubtitle(
                                                            record,
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Custom Image Badge */}
                                                <td className="px-4 py-3 text-center">
                                                    {hasCustomImage ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-700/50">
                                                            ✓
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Upload Image */}
                                                        <button
                                                            onClick={() =>
                                                                triggerFileInput(
                                                                    record,
                                                                )
                                                            }
                                                            disabled={
                                                                uploadingId ===
                                                                id
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                                                            title="Upload custom image"
                                                        >
                                                            {uploadingId ===
                                                            id ? (
                                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>

                                                        {/* Delete Image */}
                                                        {hasCustomImage && (
                                                            <button
                                                                onClick={() =>
                                                                    handleImageDelete(
                                                                        record,
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-900/30 rounded transition-colors"
                                                                title="Remove custom image"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Edit */}
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    record,
                                                                )
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/30 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
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

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    record,
                                                                )
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.lastPage > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                            <div className="text-sm text-gray-400">
                                Page {pagination.page} of {pagination.lastPage}{" "}
                                · {pagination.total.toLocaleString()} total
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        fetchRecords(pagination.page - 1)
                                    }
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() =>
                                        fetchRecords(pagination.page + 1)
                                    }
                                    disabled={
                                        pagination.page >= pagination.lastPage
                                    }
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <RecordModal
                    title={`Add New ${config.label.slice(0, -1)}`}
                    fields={config.fields}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreate}
                    onClose={() => setShowCreateModal(false)}
                    submitLabel="Create"
                    isLoading={formLoading}
                    error={error}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingRecord && (
                <RecordModal
                    title={`Edit ${config.label.slice(0, -1)}`}
                    fields={config.fields}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleUpdate}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRecord(null);
                    }}
                    submitLabel="Save Changes"
                    isLoading={formLoading}
                    disabledFields={[config.primaryKey]}
                    error={error}
                />
            )}
        </div>
    );
}

// ==================== Record Modal Component ====================

interface RecordModalProps {
    title: string;
    fields: EntityField[];
    formData: Record<string, any>;
    setFormData: (data: Record<string, any>) => void;
    onSubmit: () => void;
    onClose: () => void;
    submitLabel: string;
    isLoading: boolean;
    disabledFields?: string[];
    error?: string | null;
}

function RecordModal({
    title,
    fields,
    formData,
    setFormData,
    onSubmit,
    onClose,
    submitLabel,
    isLoading,
    disabledFields = [],
    error,
}: RecordModalProps) {
    const handleFieldChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((field) => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {field.label}
                                    {field.required && (
                                        <span className="text-red-400 ml-1">
                                            *
                                        </span>
                                    )}
                                </label>
                                <input
                                    type={
                                        field.type === "number"
                                            ? "number"
                                            : "text"
                                    }
                                    value={formData[field.key] ?? ""}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            field.key,
                                            e.target.value,
                                        )
                                    }
                                    placeholder={field.placeholder}
                                    disabled={disabledFields.includes(
                                        field.key,
                                    )}
                                    required={field.required}
                                    className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                                        disabledFields.includes(field.key)
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                />
                            </div>
                        ))}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 font-medium"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    submitLabel
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
