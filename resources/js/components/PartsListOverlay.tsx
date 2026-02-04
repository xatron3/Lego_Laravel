import { useState } from "react";

export interface PartInStep {
    partId: string;
    colorId: number;
    count: number;
    imageUrl: string;
    photoUrl?: string;
}

interface PartsListOverlayProps {
    parts: PartInStep[];
    stepNumber: number;
    totalSteps: number;
}

export default function PartsListOverlay({
    parts,
    stepNumber,
    totalSteps,
}: PartsListOverlayProps) {
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});

    const handleImageError = (partId: string) => {
        setImageErrors((prev) => ({ ...prev, [partId]: true }));
    };

    const handlePhotoError = (partId: string) => {
        setPhotoErrors((prev) => ({ ...prev, [partId]: true }));
    };

    const getImageUrl = (part: PartInStep) => {
        const key = `${part.partId}_${part.colorId}`;
        if (!imageErrors[key]) {
            return part.imageUrl;
        }
        if (part.photoUrl && !photoErrors[key]) {
            return part.photoUrl;
        }
        return null;
    };

    return (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-2xl border-2 border-gray-300 max-w-sm">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">PARTS LIST</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        Step {stepNumber}/{totalSteps}
                    </span>
                </div>
            </div>

            {/* Parts Grid */}
            <div className="p-3 max-h-96 overflow-y-auto bg-gray-50">
                {parts.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                        No parts in this step
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {parts.map((part, index) => {
                            const imageUrl = getImageUrl(part);
                            const key = `${part.partId}_${part.colorId}`;

                            return (
                                <div
                                    key={`${key}_${index}`}
                                    className="bg-white rounded border border-gray-200 p-2 flex flex-col items-center hover:shadow-md transition-shadow"
                                >
                                    {/* Part Image */}
                                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded mb-1 relative">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={part.partId}
                                                className="max-w-full max-h-full object-contain"
                                                onError={() => {
                                                    if (!imageErrors[key]) {
                                                        handleImageError(key);
                                                    } else {
                                                        handlePhotoError(key);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-2xl">🧱</span>
                                        )}
                                        {/* Quantity Badge */}
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                                            {part.count}
                                        </div>
                                    </div>

                                    {/* Part ID */}
                                    <div className="text-xs text-gray-600 font-mono text-center truncate w-full">
                                        {part.partId}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
