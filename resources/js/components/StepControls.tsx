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
}

export default function StepControls({
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
}: StepControlsProps) {
    const progress =
        totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            {/* Opacity Controls */}
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg space-y-3">
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400">
                        <span className="text-xl font-bold text-yellow-400">
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
                    title="Show/hide upcoming parts as ghosts"
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
            <div className="mb-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Start</span>
                    <span>{Math.round(progress)}% complete</span>
                    <span>End</span>
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors font-medium"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-900 rounded-lg transition-colors font-medium"
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
