import { useState, useRef } from "react";
import { socialApi } from "../../api";

interface CreatePostFormProps {
    onPostCreated: () => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [visibility, setVisibility] = useState<"public" | "followers_only">(
        "public",
    );
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const wordCount = body
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalImages = images.length + files.length;

        if (totalImages > 10) {
            setError("Maximum 10 images allowed");
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        // Create previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
        setError(null);
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        if (images.length === 0) {
            setError("At least one image is required");
            return;
        }

        if (wordCount > 500) {
            setError("Description must be 500 words or less");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("type", "build");
            formData.append("title", title.trim());
            formData.append("visibility", visibility);
            if (body.trim()) {
                formData.append("body", body.trim());
            }

            images.forEach((image) => {
                formData.append("images[]", image);
            });

            await socialApi.createPost(formData);

            // Reset form
            setTitle("");
            setBody("");
            setVisibility("public");
            setImages([]);
            previews.forEach((p) => URL.revokeObjectURL(p));
            setPreviews([]);
            setIsOpen(false);

            onPostCreated();
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-left hover:border-gray-600 hover:bg-gray-800/70 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                        <svg
                            className="w-5 h-5 text-white"
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
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
                        Share your latest LEGO build...
                    </span>
                </div>
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
        >
            <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        New LEGO Build Post
                    </h3>
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        className="text-gray-400 hover:text-gray-300 p-1"
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

                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What did you build?"
                    maxLength={200}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none mb-3"
                />

                {/* Description */}
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Tell us about your build... (optional, max 500 words)"
                    rows={4}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none resize-none"
                />
                <div className="flex justify-end mt-1">
                    <span
                        className={`text-xs ${wordCount > 500 ? "text-red-400" : "text-gray-500"}`}
                    >
                        {wordCount}/500 words
                        {/* Visibility */}
                        <div className="mt-3">
                            <label className="block text-sm text-gray-400 mb-2">
                                Who can see this post?
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) =>
                                    setVisibility(
                                        e.target.value as
                                            | "public"
                                            | "followers_only",
                                    )
                                }
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none"
                            >
                                <option value="public">
                                    🌍 Public - Anyone can see
                                </option>
                                <option value="followers_only">
                                    👥 Followers Only - Only people who follow
                                    you
                                </option>
                            </select>
                        </div>
                    </span>
                </div>
            </div>

            {/* Image Upload Area */}
            <div className="p-4 border-b border-gray-700/50">
                {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {previews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative group aspect-square"
                            >
                                <img
                                    src={preview}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg
                                        className="w-3 h-3"
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
                        ))}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 10}
                    className="w-full border-2 border-dashed border-gray-600 rounded-lg py-4 text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex flex-col items-center gap-1">
                        <svg
                            className="w-6 h-6"
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
                        <span className="text-sm">
                            {images.length > 0
                                ? `Add more photos (${images.length}/10)`
                                : "Add photos of your build"}
                        </span>
                    </div>
                </button>
            </div>

            {/* Error & Submit */}
            <div className="p-4 flex items-center justify-between">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="ml-auto flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            isSubmitting || !title.trim() || images.length === 0
                        }
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Posting...
                            </span>
                        ) : (
                            "Post Build"
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
