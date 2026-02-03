import { useMemo, useState } from "react";
import { Step } from "../parser";

interface PartsListProps {
    steps: Step[];
    currentStep: number;
}

interface PartCount {
    partId: string;
    count: number;
}

export default function PartsList({ steps, currentStep }: PartsListProps) {
    const [showAllParts, setShowAllParts] = useState(false);

    // Calculate total parts for entire model
    const allParts = useMemo(() => {
        const partMap = new Map<string, number>();
        steps.forEach((step) => {
            step.parts.forEach((part) => {
                const current = partMap.get(part.partId) || 0;
                partMap.set(part.partId, current + 1);
            });
        });
        const parts: PartCount[] = [];
        partMap.forEach((count, partId) => {
            parts.push({ partId, count });
        });
        return parts.sort((a, b) => b.count - a.count);
    }, [steps]);

    // Calculate parts for current step only
    const currentStepParts = useMemo(() => {
        if (steps.length === 0 || currentStep >= steps.length) return [];
        const partMap = new Map<string, number>();
        steps[currentStep].parts.forEach((part) => {
            const current = partMap.get(part.partId) || 0;
            partMap.set(part.partId, current + 1);
        });
        const parts: PartCount[] = [];
        partMap.forEach((count, partId) => {
            parts.push({ partId, count });
        });
        return parts.sort((a, b) => b.count - a.count);
    }, [steps, currentStep]);

    // Calculate parts built so far (up to and including current step)
    const partsBuiltSoFar = useMemo(() => {
        let count = 0;
        for (let i = 0; i <= currentStep && i < steps.length; i++) {
            count += steps[i].parts.length;
        }
        return count;
    }, [steps, currentStep]);

    const totalPartsCount = useMemo(() => {
        return steps.reduce((sum, step) => sum + step.parts.length, 0);
    }, [steps]);

    if (steps.length === 0) return null;

    const displayParts = showAllParts ? allParts : currentStepParts;

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    Parts List
                </h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setShowAllParts(false)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            !showAllParts
                                ? "bg-yellow-400/20 text-yellow-400"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                    >
                        Step
                    </button>
                    <button
                        onClick={() => setShowAllParts(true)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            showAllParts
                                ? "bg-yellow-400/20 text-yellow-400"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-3 p-2 bg-gray-700/50 rounded-lg">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>
                        {partsBuiltSoFar} / {totalPartsCount} parts
                    </span>
                </div>
                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-yellow-400 to-green-400 transition-all duration-300"
                        style={{
                            width: `${totalPartsCount > 0 ? (partsBuiltSoFar / totalPartsCount) * 100 : 0}%`,
                        }}
                    />
                </div>
            </div>

            {/* Parts list */}
            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {displayParts.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-2">
                        No parts in this step
                    </p>
                ) : (
                    displayParts.map((part) => (
                        <div
                            key={part.partId}
                            className="flex items-center justify-between px-2 py-1.5 bg-gray-700/50 rounded text-sm"
                        >
                            <span
                                className="text-gray-300 truncate flex-1"
                                title={part.partId}
                            >
                                {part.partId}
                            </span>
                            <span className="text-yellow-400 font-medium ml-2">
                                ×{part.count}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs">
                <span className="text-gray-400">
                    {showAllParts ? "Total unique parts:" : "Parts in step:"}
                </span>
                <span className="text-white font-medium">
                    {displayParts.length} types (
                    {displayParts.reduce((sum, p) => sum + p.count, 0)} pcs)
                </span>
            </div>
        </div>
    );
}
