import React from "react";

interface StepControlsProps {
    currentStep: number;
    totalSteps: number;
    onPrevious: () => void;
    onNext: () => void;
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

function StepControls({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
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
}: StepControlsProps) {
    const progress =
        totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg space-y-4">
            {/* Keyboard Shortcuts Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs font-medium text-blue-400 mb-2">
                    ⌨️ Keyboard Shortcuts:
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-400">
                    <div>← → : Navigate</div>
                    <div>Home/End : First/Last</div>
                    <div>G : Toggle Preview</div>
                    <div>B : Toggle Border</div>
                    <div>D : Toggle Dim</div>
                </div>
            </div>

            {/* Border Controls */}
            <div className="p-3 bg-gray-700/50 rounded-lg space-y-3">
                {" "}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                        Highlight Current Step
                    </span>
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
                {showCurrentStepBorder && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-gray-400">
                                Border Color
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={currentStepBorderColor}
                                onChange={(e) =>
                                    onBorderColorChange(e.target.value)
                                }
                                className="w-12 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
                            />
                            <span className="text-xs text-gray-400 font-mono">
                                {currentStepBorderColor.toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Opacity Controls */}
            <div className="p-3 bg-gray-700/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                        Dim Previous Steps
                    </span>
                    <button
                        onClick={onToggleDimPreviousSteps}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            dimPreviousSteps ? "bg-yellow-400" : "bg-gray-600"
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
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-gray-400">
                                Opacity
                            </label>
                            <span className="text-xs text-yellow-400 font-medium">
                                {Math.round(previousStepsOpacity * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.05"
                            max="0.8"
                            step="0.05"
                            value={previousStepsOpacity}
                            onChange={(e) =>
                                onOpacityChange(parseFloat(e.target.value))
                            }
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                        />
                    </div>
                )}
            </div>

            {/* Step indicator header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400 shadow-lg shadow-yellow-400/20">
                        <span className="text-2xl font-bold text-yellow-400">
                            {currentStep + 1}
                        </span>
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-white">
                            Step {currentStep + 1}
                        </div>
                        <div className="text-sm text-gray-400">
                            of {totalSteps} steps
                        </div>
                    </div>
                </div>

                {/* Ghost parts toggle */}
                <button
                    onClick={onToggleGhostParts}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        showGhostParts
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600"
                    }`}
                    title="Show/hide upcoming parts as ghosts (G)"
                >
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                    Preview
                </button>
            </div>

            {/* Progress bar */}
            <div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 ease-out shadow-lg"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Start</span>
                    <span className="font-semibold text-yellow-400">
                        {Math.round(progress)}% complete
                    </span>
                    <span>End</span>
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                    title="Previous Step (← or ↑)"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Previous
                </button>

                <button
                    onClick={onNext}
                    disabled={currentStep >= totalSteps - 1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-900 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                    title="Next Step (→ or ↓)"
                >
                    Next
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
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default React.memo(StepControls);
