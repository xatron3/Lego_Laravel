import { useState } from "react";

interface CompactStepOverlayProps {
    currentStep: number;
    totalSteps: number;
    showGhostParts: boolean;
    onToggleGhostParts: () => void;
    dimPreviousSteps: boolean;
    onToggleDimPreviousSteps: () => void;
    previousStepsOpacity: number;
    onOpacityChange: (opacity: number) => void;
    showCurrentStepBorder: boolean;
    onToggleCurrentStepBorder: () => void;
    currentStepBorderColor: string;
    onBorderColorChange: (color: string) => void;
}

export default function CompactStepOverlay({
    currentStep,
    totalSteps,
    showGhostParts,
    onToggleGhostParts,
    dimPreviousSteps,
    onToggleDimPreviousSteps,
    previousStepsOpacity,
    onOpacityChange,
    showCurrentStepBorder,
    onToggleCurrentStepBorder,
    currentStepBorderColor,
    onBorderColorChange,
}: CompactStepOverlayProps) {
    const [showSettings, setShowSettings] = useState(false);

    const progress =
        totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Main Control Bar */}
            <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400">
                            <span className="text-xl font-bold text-yellow-400">
                                {currentStep + 1}
                            </span>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">
                                Step {currentStep + 1}
                            </div>
                            <div className="text-xs text-gray-400">
                                of {totalSteps}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 px-4">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Ghost Preview Toggle */}
                        <button
                            onClick={onToggleGhostParts}
                            className={`p-2 rounded-lg transition-colors ${
                                showGhostParts
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-400"
                            }`}
                            title="Toggle Ghost Preview (G)"
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        </button>

                        {/* Settings Toggle */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${
                                showSettings
                                    ? "bg-yellow-400/20 text-yellow-400"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-400"
                            }`}
                            title="Display Settings"
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
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Expandable Settings Panel */}
                {showSettings && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4">
                        {/* Border Controls */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                                Highlight Current Step
                            </span>
                            <div className="flex items-center gap-3">
                                {showCurrentStepBorder && (
                                    <input
                                        type="color"
                                        value={currentStepBorderColor}
                                        onChange={(e) =>
                                            onBorderColorChange(e.target.value)
                                        }
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
                                        title="Border Color"
                                    />
                                )}
                                <button
                                    onClick={onToggleCurrentStepBorder}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        showCurrentStepBorder
                                            ? "bg-yellow-400"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            showCurrentStepBorder
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Dim Controls */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">
                                    Dim Previous Steps
                                </span>
                                <button
                                    onClick={onToggleDimPreviousSteps}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        dimPreviousSteps
                                            ? "bg-yellow-400"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            dimPreviousSteps
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                            {dimPreviousSteps && (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 w-16">
                                        Opacity
                                    </span>
                                    <input
                                        type="range"
                                        min="0.05"
                                        max="0.8"
                                        step="0.05"
                                        value={previousStepsOpacity}
                                        onChange={(e) =>
                                            onOpacityChange(
                                                parseFloat(e.target.value),
                                            )
                                        }
                                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                                    />
                                    <span className="text-xs text-yellow-400 font-medium w-12 text-right">
                                        {Math.round(previousStepsOpacity * 100)}
                                        %
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
