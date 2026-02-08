import React, { useState, useCallback } from "react";
import { api, LegoModelData } from "../../api";
import { useModelLoader } from "../../hooks/useModelLoader";

// Step indicator constants
const STEPS = [
    { id: 1, name: "General Info", description: "Name and description" },
    { id: 2, name: "Files", description: "Upload LDraw and PDF" },
    { id: 3, name: "Images", description: "Add photos" },
    { id: 4, name: "Review", description: "Confirm and submit" },
];

interface MocSubmitWizardProps {
    onSuccess?: (moc: LegoModelData) => void;
    onCancel?: () => void;
}

interface ImagePreview {
    file: File;
    preview: string;
}

export default function MocSubmitWizard({
    onSuccess,
    onCancel,
}: MocSubmitWizardProps) {
    const { steps: parsedSteps, modelText, loadFile, reset } = useModelLoader();

    // Current step
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: General Info
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [price, setPrice] = useState("");

    // Step 2: Build File
    const [fileName, setFileName] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfFileName, setPdfFileName] = useState("");

    // Step 3: Images
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

    // Step 4: Share to feed
    const [shareToFeed, setShareToFeed] = useState(false);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [createdMoc, setCreatedMoc] = useState<LegoModelData | null>(null);

    // Computed values
    const totalParts = parsedSteps.reduce(
        (sum, step) => sum + step.parts.length,
        0,
    );
    const totalSteps = parsedSteps.length;

    // Step validation
    const isStep1Valid = name.trim().length > 0;
    const isStep2Valid =
        modelText !== null && modelText.length > 0 && pdfFile !== null;
    const isStep3Valid = true; // Images are optional

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return isStep1Valid;
            case 2:
                return isStep2Valid;
            case 3:
                return isStep3Valid;
            case 4:
                return isStep1Valid && isStep2Valid;
            default:
                return false;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        await loadFile(file);
        setError(null);
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPdfFile(file);
        setPdfFileName(file.name);
        setError(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit to 8 images total
        const remaining = 8 - imagePreviews.length;
        const filesToAdd = files.slice(0, remaining);

        const newPreviews = filesToAdd.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setImagePreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeImage = (index: number) => {
        setImagePreviews((prev) => {
            const removed = prev[index];
            URL.revokeObjectURL(removed.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const moveImage = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= imagePreviews.length) return;

        setImagePreviews((prev) => {
            const newPreviews = [...prev];
            [newPreviews[index], newPreviews[newIndex]] = [
                newPreviews[newIndex],
                newPreviews[index],
            ];
            return newPreviews;
        });
    };

    const handleSubmit = async () => {
        if (!modelText || !name.trim() || !pdfFile) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Create the MOC
            const moc = await api.saveModel({
                name: name.trim(),
                description: description.trim() || undefined,
                ldr_content: modelText,
                file_name: fileName,
                instructions_pdf: pdfFile,
                total_steps: totalSteps,
                total_parts: totalParts,
                is_public: isPublic,
                price: price ? parseFloat(price) : null,
                share_to_feed: shareToFeed,
            });

            // 2. Upload images if any
            if (imagePreviews.length > 0 && moc.id) {
                const files = imagePreviews.map((p) => p.file);
                await api.uploadMocImages(moc.id, files);
            }

            // Clean up
            imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview));

            setSuccess(true);
            setCreatedMoc(moc);
            reset();

            if (onSuccess) {
                onSuccess(moc);
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit model");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setCurrentStep(1);
        setName("");
        setDescription("");
        setIsPublic(false);
        setPrice("");
        setShareToFeed(false);
        setFileName("");
        setPdfFile(null);
        setPdfFileName("");
        imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview));
        setImagePreviews([]);
        setSuccess(false);
        setCreatedMoc(null);
        setError(null);
        reset();
    };

    // Success state
    if (success) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    MOC Submitted Successfully!
                </h2>
                <p className="text-gray-400 mb-6">
                    Your creation "{createdMoc?.name}" has been saved.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                        Submit Another
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Step Indicator */}
            <nav aria-label="Progress" className="mb-8">
                <ol className="flex items-center">
                    {STEPS.map((step, stepIdx) => (
                        <li
                            key={step.id}
                            className={`relative ${stepIdx !== STEPS.length - 1 ? "flex-1 pr-8" : ""}`}
                        >
                            {step.id < currentStep ? (
                                // Completed step
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    className="group flex flex-col items-center w-full"
                                >
                                    <span className="flex items-center justify-center w-10 h-10 bg-yellow-500 rounded-full group-hover:bg-yellow-400 transition-colors">
                                        <svg
                                            className="w-5 h-5 text-gray-900"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                    <span className="mt-2 text-sm font-medium text-yellow-400">
                                        {step.name}
                                    </span>
                                </button>
                            ) : step.id === currentStep ? (
                                // Current step
                                <div className="flex flex-col items-center">
                                    <span className="flex items-center justify-center w-10 h-10 bg-yellow-500 rounded-full border-4 border-yellow-500/30">
                                        <span className="text-gray-900 font-bold">
                                            {step.id}
                                        </span>
                                    </span>
                                    <span className="mt-2 text-sm font-medium text-white">
                                        {step.name}
                                    </span>
                                </div>
                            ) : (
                                // Future step
                                <div className="flex flex-col items-center">
                                    <span className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full border-2 border-gray-600">
                                        <span className="text-gray-400">
                                            {step.id}
                                        </span>
                                    </span>
                                    <span className="mt-2 text-sm font-medium text-gray-500">
                                        {step.name}
                                    </span>
                                </div>
                            )}
                            {stepIdx !== STEPS.length - 1 && (
                                <div
                                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                        step.id < currentStep
                                            ? "bg-yellow-500"
                                            : "bg-gray-700"
                                    }`}
                                    style={{ transform: "translateX(20px)" }}
                                />
                            )}
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                {/* Step 1: General Info */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                General Information
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Enter basic details about your MOC creation.
                            </p>
                        </div>

                        <div>
                            <label className="block text-white font-medium mb-2">
                                Model Name{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                placeholder="Describe your model, building techniques, inspiration, etc."
                            />
                        </div>

                        <div className="flex items-center gap-6">
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
                                <p className="text-gray-500 text-sm mt-2">
                                    Set a price to sell your MOC or leave empty
                                    to offer it for free.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Files */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Files
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Upload your LDraw file (.ldr or .mpd) and PDF
                                build instructions.
                            </p>
                        </div>

                        {/* LDraw File Upload */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                LDraw File{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-yellow-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".ldr,.mpd"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="ldr-file-upload"
                                />
                                <label
                                    htmlFor="ldr-file-upload"
                                    className="cursor-pointer"
                                >
                                    {fileName ? (
                                        <div>
                                            <svg
                                                className="w-12 h-12 text-green-400 mx-auto mb-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <p className="text-white font-medium">
                                                {fileName}
                                            </p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                {totalSteps} steps, {totalParts}{" "}
                                                parts
                                            </p>
                                            <p className="text-yellow-400 text-sm mt-2">
                                                Click to replace file
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <svg
                                                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                />
                                            </svg>
                                            <p className="text-gray-400">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                .ldr or .mpd files only
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* PDF Instructions Upload */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Build Instructions (PDF){" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-yellow-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handlePdfUpload}
                                    className="hidden"
                                    id="pdf-file-upload"
                                />
                                <label
                                    htmlFor="pdf-file-upload"
                                    className="cursor-pointer"
                                >
                                    {pdfFileName ? (
                                        <div>
                                            <svg
                                                className="w-12 h-12 text-green-400 mx-auto mb-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <p className="text-white font-medium">
                                                {pdfFileName}
                                            </p>
                                            <p className="text-yellow-400 text-sm mt-2">
                                                Click to replace file
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <svg
                                                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-gray-400">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                PDF files only (max 50MB)
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {modelText && (
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="text-white font-medium mb-3">
                                    File Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">
                                            Total Steps
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {totalSteps}
                                        </div>
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">
                                            Total Parts
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {totalParts.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Images
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Add photos of your MOC to showcase it. The first
                                image will be used as the thumbnail. You can
                                upload up to 8 images.
                            </p>
                        </div>

                        {/* Image Upload */}
                        {imagePreviews.length < 8 && (
                            <div>
                                <label className="block text-white font-medium mb-2">
                                    Upload Images
                                </label>
                                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-yellow-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer"
                                    >
                                        <svg
                                            className="w-12 h-12 text-gray-400 mx-auto mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p className="text-gray-400">
                                            Click to upload images
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            JPEG, PNG, GIF, or WebP (max 5MB
                                            each)
                                        </p>
                                        <p className="text-yellow-500 text-sm mt-2 font-medium">
                                            💡 Best results: 5:4 aspect ratio
                                            (e.g., 1000×800px)
                                        </p>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-medium">
                                        Uploaded Images ({imagePreviews.length}
                                        /8)
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Drag to reorder • First image is
                                        thumbnail
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="relative group"
                                        >
                                            <div className="aspect-5/4 rounded-lg overflow-hidden bg-gray-700">
                                                <img
                                                    src={preview.preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {index === 0 && (
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded">
                                                    Thumbnail
                                                </span>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                {index > 0 && (
                                                    <button
                                                        onClick={() =>
                                                            moveImage(
                                                                index,
                                                                "up",
                                                            )
                                                        }
                                                        className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                                        title="Move left"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-white"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 19l-7-7 7-7"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                                {index <
                                                    imagePreviews.length -
                                                        1 && (
                                                    <button
                                                        onClick={() =>
                                                            moveImage(
                                                                index,
                                                                "down",
                                                            )
                                                        }
                                                        className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                                        title="Move right"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-white"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5l7 7-7 7"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                    className="p-2 bg-red-500 rounded-lg hover:bg-red-400 transition-colors"
                                                    title="Remove"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-white"
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {imagePreviews.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>
                                    No images uploaded yet. Images are optional
                                    but recommended.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Review & Submit
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Review your MOC details before submitting.
                            </p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid gap-6">
                            {/* General Info */}
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-medium">
                                        General Information
                                    </h3>
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="text-yellow-400 text-sm hover:text-yellow-300"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <dl className="space-y-2">
                                    <div className="flex">
                                        <dt className="w-24 text-gray-400">
                                            Name:
                                        </dt>
                                        <dd className="text-white">{name}</dd>
                                    </div>
                                    {description && (
                                        <div className="flex">
                                            <dt className="w-24 text-gray-400">
                                                Description:
                                            </dt>
                                            <dd className="text-white line-clamp-2">
                                                {description}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="flex">
                                        <dt className="w-24 text-gray-400">
                                            Visibility:
                                        </dt>
                                        <dd className="text-white">
                                            {isPublic ? (
                                                <span className="text-green-400">
                                                    Public
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    Private
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                    {isPublic && (
                                        <div className="flex">
                                            <dt className="w-24 text-gray-400">
                                                Price:
                                            </dt>
                                            <dd className="text-white">
                                                {price ? (
                                                    <span className="text-yellow-400">
                                                        $
                                                        {parseFloat(
                                                            price,
                                                        ).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400">
                                                        Free
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Build Data */}
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-medium">
                                        Build Data
                                    </h3>
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="text-yellow-400 text-sm hover:text-yellow-300"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <dl className="space-y-2">
                                    <div className="flex">
                                        <dt className="w-24 text-gray-400">
                                            File:
                                        </dt>
                                        <dd className="text-white">
                                            {fileName}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-24 text-gray-400">
                                            Steps:
                                        </dt>
                                        <dd className="text-white">
                                            {totalSteps}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-24 text-gray-400">
                                            Parts:
                                        </dt>
                                        <dd className="text-white">
                                            {totalParts.toLocaleString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Images */}
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-medium">
                                        Images
                                    </h3>
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        className="text-yellow-400 text-sm hover:text-yellow-300"
                                    >
                                        Edit
                                    </button>
                                </div>
                                {imagePreviews.length > 0 ? (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {imagePreviews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="relative shrink-0"
                                            >
                                                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-700">
                                                    <img
                                                        src={preview.preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {index === 0 && (
                                                    <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-yellow-500 text-gray-900 text-xs font-bold rounded">
                                                        1st
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No images uploaded
                                    </p>
                                )}
                            </div>

                            {/* Share to Community */}
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="text-white font-medium mb-3">
                                    Community Sharing
                                </h3>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={shareToFeed}
                                        onChange={(e) =>
                                            setShareToFeed(e.target.checked)
                                        }
                                        className="mt-1 w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-800"
                                    />
                                    <div className="flex-1">
                                        <div className="text-white group-hover:text-yellow-400 transition-colors">
                                            Share this MOC to the community feed
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Auto-generates a post with your
                                            MOC's images and details. Users can
                                            view the post and visit your store
                                            page.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={() =>
                        currentStep === 1
                            ? onCancel?.()
                            : setCurrentStep(currentStep - 1)
                    }
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                    {currentStep === 1 ? "Cancel" : "Back"}
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!canProceed()}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canProceed()}
                        className="px-8 py-3 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                Submitting...
                            </span>
                        ) : (
                            "Submit MOC"
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
