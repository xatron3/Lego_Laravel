import React, { useState, useEffect, useCallback } from "react";
import { api, LegoModelData, MocImageData } from "../../api";

interface MocEditModalProps {
    moc: LegoModelData;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedMoc: LegoModelData) => void;
}

export default function MocEditModal({
    moc,
    isOpen,
    onClose,
    onSave,
}: MocEditModalProps) {
    // Form state
    const [name, setName] = useState(moc.name);
    const [description, setDescription] = useState(moc.description || "");
    const [isPublic, setIsPublic] = useState(moc.is_public || false);
    const [price, setPrice] = useState(moc.price ? String(moc.price) : "");

    // Images state
    const [existingImages, setExistingImages] = useState<MocImageData[]>(
        moc.images || [],
    );
    const [newImageFiles, setNewImageFiles] = useState<
        { file: File; preview: string }[]
    >([]);
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

    // UI state
    const [activeTab, setActiveTab] = useState<"info" | "images">("info");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // Reset form when moc changes
    useEffect(() => {
        setName(moc.name);
        setDescription(moc.description || "");
        setIsPublic(moc.is_public || false);
        setPrice(moc.price ? String(moc.price) : "");
        setExistingImages(moc.images || []);
        setNewImageFiles([]);
        setImagesToDelete([]);
        setError(null);
    }, [moc]);

    const totalImages =
        existingImages.filter((img) => !imagesToDelete.includes(img.id))
            .length + newImageFiles.length;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = 8 - totalImages;
        const filesToAdd = files.slice(0, remaining);

        const newPreviews = filesToAdd.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setNewImageFiles((prev) => [...prev, ...newPreviews]);
    };

    const handleRemoveExistingImage = (imageId: number) => {
        setImagesToDelete((prev) => [...prev, imageId]);
    };

    const handleRestoreImage = (imageId: number) => {
        setImagesToDelete((prev) => prev.filter((id) => id !== imageId));
    };

    const handleRemoveNewImage = (index: number) => {
        setNewImageFiles((prev) => {
            const removed = prev[index];
            URL.revokeObjectURL(removed.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSetPrimary = async (imageId: number) => {
        if (!moc.id) return;

        try {
            await api.setPrimaryMocImage(moc.id, imageId);
            setExistingImages((prev) =>
                prev.map((img) => ({
                    ...img,
                    is_primary: img.id === imageId,
                })),
            );
        } catch (err: any) {
            setError(err.message || "Failed to set primary image");
        }
    };

    const handleReorderImages = async (imageIds: number[]) => {
        if (!moc.id) return;

        try {
            await api.reorderMocImages(moc.id, imageIds);
            // Reorder local state
            const reordered = imageIds
                .map((id) => existingImages.find((img) => img.id === id))
                .filter(Boolean) as MocImageData[];
            setExistingImages(reordered);
        } catch (err: any) {
            setError(err.message || "Failed to reorder images");
        }
    };

    const moveExistingImage = (index: number, direction: "up" | "down") => {
        const filteredImages = existingImages.filter(
            (img) => !imagesToDelete.includes(img.id),
        );
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= filteredImages.length) return;

        const newImages = [...filteredImages];
        [newImages[index], newImages[newIndex]] = [
            newImages[newIndex],
            newImages[index],
        ];

        // Save reorder immediately
        handleReorderImages(newImages.map((img) => img.id));
    };

    const handleSave = async () => {
        if (!moc.id) return;

        setIsSaving(true);
        setError(null);

        try {
            // 1. Update MOC details
            const updatedMoc = await api.updateModel(moc.id, {
                name: name.trim(),
                description: description.trim() || undefined,
                is_public: isPublic,
                price: price ? parseFloat(price) : null,
            });

            // 2. Delete marked images
            for (const imageId of imagesToDelete) {
                try {
                    await api.deleteMocImage(moc.id, imageId);
                } catch (err) {
                    console.error("Failed to delete image:", err);
                }
            }

            // 3. Upload new images
            if (newImageFiles.length > 0) {
                setIsUploadingImages(true);
                try {
                    const files = newImageFiles.map((p) => p.file);
                    await api.uploadMocImages(moc.id, files);
                } catch (err: any) {
                    console.error("Failed to upload images:", err);
                }
                setIsUploadingImages(false);
            }

            // Clean up previews
            newImageFiles.forEach((p) => URL.revokeObjectURL(p.preview));

            // Reload the moc to get updated images
            const refreshedMoc = await api.getModel(moc.id);
            onSave(refreshedMoc);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredExistingImages = existingImages.filter(
        (img) => !imagesToDelete.includes(img.id),
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/70 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">
                            Edit MOC
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 pt-4 border-b border-gray-700">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab("info")}
                                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "info"
                                        ? "border-yellow-500 text-yellow-400"
                                        : "border-transparent text-gray-400 hover:text-white"
                                }`}
                            >
                                General Info
                            </button>
                            <button
                                onClick={() => setActiveTab("images")}
                                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "images"
                                        ? "border-yellow-500 text-yellow-400"
                                        : "border-transparent text-gray-400 hover:text-white"
                                }`}
                            >
                                Images ({totalImages}/8)
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Info Tab */}
                        {activeTab === "info" && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Model Name{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder="Enter model name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                        placeholder="Describe your model..."
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={(e) =>
                                                setIsPublic(e.target.checked)
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

                                {isPublic && (
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Price (leave empty for free)
                                        </label>
                                        <div className="relative max-w-xs">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) =>
                                                    setPrice(e.target.value)
                                                }
                                                className="w-full px-4 py-3 pl-8 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Read-only build info */}
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-white font-medium mb-3">
                                        Build Info
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {moc.total_parts?.toLocaleString() ||
                                                    0}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                Parts
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {moc.total_steps || 0}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                Steps
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white truncate">
                                                {moc.file_name || "N/A"}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                File
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Images Tab */}
                        {activeTab === "images" && (
                            <div className="space-y-6">
                                {/* Upload new images */}
                                {totalImages < 8 && (
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Add Images
                                        </label>
                                        <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-500 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="edit-image-upload"
                                            />
                                            <label
                                                htmlFor="edit-image-upload"
                                                className="cursor-pointer"
                                            >
                                                <svg
                                                    className="w-10 h-10 text-gray-400 mx-auto mb-2"
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
                                                <p className="text-gray-400 text-sm">
                                                    Click to add more images
                                                </p>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Existing images */}
                                {filteredExistingImages.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-white font-medium">
                                                Current Images
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                First image is used as thumbnail
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            {filteredExistingImages.map(
                                                (image, index) => (
                                                    <div
                                                        key={image.id}
                                                        className="relative group"
                                                    >
                                                        <div className="aspect-5/4 rounded-lg overflow-hidden bg-gray-700">
                                                            <img
                                                                src={image.url}
                                                                alt={`Image ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        {index === 0 && (
                                                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-gray-900 text-xs font-bold rounded">
                                                                Thumbnail
                                                            </span>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                                            {index > 0 && (
                                                                <button
                                                                    onClick={() =>
                                                                        moveExistingImage(
                                                                            index,
                                                                            "up",
                                                                        )
                                                                    }
                                                                    className="p-1.5 bg-gray-700 rounded hover:bg-gray-600"
                                                                    title="Move left"
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3 text-white"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M15 19l-7-7 7-7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {index <
                                                                filteredExistingImages.length -
                                                                    1 && (
                                                                <button
                                                                    onClick={() =>
                                                                        moveExistingImage(
                                                                            index,
                                                                            "down",
                                                                        )
                                                                    }
                                                                    className="p-1.5 bg-gray-700 rounded hover:bg-gray-600"
                                                                    title="Move right"
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3 text-white"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M9 5l7 7-7 7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveExistingImage(
                                                                        image.id,
                                                                    )
                                                                }
                                                                className="p-1.5 bg-red-500 rounded hover:bg-red-400"
                                                                title="Remove"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Deleted images (can restore) */}
                                {imagesToDelete.length > 0 && (
                                    <div>
                                        <h3 className="text-red-400 font-medium mb-3">
                                            Images to be removed
                                        </h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {imagesToDelete.map((imageId) => {
                                                const image =
                                                    existingImages.find(
                                                        (img) =>
                                                            img.id === imageId,
                                                    );
                                                if (!image) return null;
                                                return (
                                                    <div
                                                        key={imageId}
                                                        className="relative"
                                                    >
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 opacity-50">
                                                            <img
                                                                src={image.url}
                                                                alt="To delete"
                                                                className="w-full h-full object-cover grayscale"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleRestoreImage(
                                                                    imageId,
                                                                )
                                                            }
                                                            className="absolute -top-1 -right-1 p-1 bg-green-500 rounded-full hover:bg-green-400"
                                                            title="Restore"
                                                        >
                                                            <svg
                                                                className="w-3 h-3 text-white"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* New images to upload */}
                                {newImageFiles.length > 0 && (
                                    <div>
                                        <h3 className="text-green-400 font-medium mb-3">
                                            New images to upload
                                        </h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            {newImageFiles.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative group"
                                                    >
                                                        <div className="aspect-5/4 rounded-lg overflow-hidden bg-gray-700 ring-2 ring-green-500/50">
                                                            <img
                                                                src={
                                                                    preview.preview
                                                                }
                                                                alt={`New ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                                                            New
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveNewImage(
                                                                    index,
                                                                )
                                                            }
                                                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Remove"
                                                        >
                                                            <svg
                                                                className="w-3 h-3 text-white"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M6 18L18 6M6 6l12 12"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {totalImages === 0 && (
                                    <p className="text-center text-gray-500 py-4">
                                        No images. Add some to showcase your
                                        MOC!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                    {isUploadingImages
                                        ? "Uploading..."
                                        : "Saving..."}
                                </span>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
