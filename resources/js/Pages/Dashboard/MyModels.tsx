import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import MocEditModal from "../../components/moc/MocEditModal";
import { api, LegoModelData } from "../../api";

type FilterType = "all" | "created" | "owned";

interface MyModelsProps {
    models: LegoModelData[];
    filter: FilterType;
}

export default function MyModels({ models, filter = "all" }: MyModelsProps) {
    const { user } = useAuth();
    const [editingMoc, setEditingMoc] = useState<LegoModelData | null>(null);

    const handleMocEditSave = () => {
        setEditingMoc(null);
        router.reload();
    };

    const handleDeleteModel = async (id: number) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            await api.deleteModel(id);
            router.reload();
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
            router.reload();
        } catch (error: any) {
            console.error("Failed to remove model:", error);
            alert(error.message || "Failed to remove model");
        }
    };

    return (
        <DashboardLayout currentPage="my-models">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">My Models</h1>
                    <div className="flex gap-2">
                        <Link
                            href="/dashboard/my-models?filter=all"
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === "all"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                            All
                        </Link>
                        <Link
                            href="/dashboard/my-models?filter=created"
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === "created"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                            Created by Me
                        </Link>
                        <Link
                            href="/dashboard/my-models?filter=owned"
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === "owned"
                                    ? "bg-yellow-500 text-gray-900"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                            Purchased/Claimed
                        </Link>
                    </div>
                </div>

                {models.length > 0 ? (
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
                                        <span>{model.total_parts} parts</span>
                                        <span>{model.total_steps} steps</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/viewer/${model.id}`}
                                            className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium text-center rounded-lg transition-colors"
                                        >
                                            View
                                        </Link>
                                        {model.user_id === user?.id ? (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        setEditingMoc(model)
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
                                                            strokeWidth={2}
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
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </>
                                        ) : (
                                            (model as any).ownership_type ===
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
                        <Link
                            href="/dashboard/submit"
                            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                        >
                            Submit New Model
                        </Link>
                    </div>
                )}
            </div>

            {/* Edit MOC Modal */}
            {editingMoc && (
                <MocEditModal
                    moc={editingMoc}
                    isOpen={true}
                    onClose={() => setEditingMoc(null)}
                    onSave={handleMocEditSave}
                />
            )}
        </DashboardLayout>
    );
}
