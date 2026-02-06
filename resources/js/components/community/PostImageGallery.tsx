import { useState } from "react";
import { PostImageData } from "../../api";

interface PostImageGalleryProps {
    images: PostImageData[];
}

export default function PostImageGallery({ images }: PostImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    if (images.length === 0) return null;

    const gridClass =
        images.length === 1
            ? "grid-cols-1"
            : images.length === 2
              ? "grid-cols-2"
              : images.length === 3
                ? "grid-cols-2"
                : "grid-cols-2";

    return (
        <>
            <div
                className={`grid ${gridClass} gap-0.5 mx-4 mb-3 rounded-lg overflow-hidden`}
            >
                {images.slice(0, 4).map((img, index) => (
                    <button
                        key={img.id}
                        onClick={() => setSelectedImage(index)}
                        className={`relative overflow-hidden bg-gray-700 ${
                            images.length === 1
                                ? "aspect-[16/10]"
                                : images.length === 3 && index === 0
                                  ? "row-span-2 aspect-auto h-full"
                                  : "aspect-square"
                        }`}
                    >
                        <img
                            src={img.url}
                            alt={img.filename || "Post image"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {index === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                    +{images.length - 4}
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <svg
                            className="w-8 h-8"
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

                    {selectedImage > 0 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(selectedImage - 1);
                            }}
                        >
                            <svg
                                className="w-8 h-8"
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

                    {selectedImage < images.length - 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(selectedImage + 1);
                            }}
                        >
                            <svg
                                className="w-8 h-8"
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

                    <img
                        src={images[selectedImage].url}
                        alt={images[selectedImage].filename || "Post image"}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                        {selectedImage + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}
