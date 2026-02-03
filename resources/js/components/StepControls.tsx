interface StepControlsProps {
    currentStep: number;
    totalSteps: number;
    onPrevious: () => void;
    onNext: () => void;
}

export default function StepControls({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
}: StepControlsProps) {
    return (
        <div className="flex items-center gap-3 bg-gray-700 px-4 py-2 rounded-lg">
            <button
                onClick={onPrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
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
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                Prev
            </button>

            <div className="px-3 py-1 bg-gray-800 rounded text-sm font-medium">
                Step <span className="text-yellow-400">{currentStep + 1}</span>{" "}
                / {totalSteps}
            </div>

            <button
                onClick={onNext}
                disabled={currentStep >= totalSteps - 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            >
                Next
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
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>
        </div>
    );
}
