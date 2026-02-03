import { Step } from "../parser";

interface StepPreviewProps {
    steps: Step[];
    currentStep: number;
    onStepClick: (step: number) => void;
}

export default function StepPreview({
    steps,
    currentStep,
    onStepClick,
}: StepPreviewProps) {
    if (steps.length === 0) return null;

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
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
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                </svg>
                Step Navigator
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 flex-wrap">
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <button
                            key={index}
                            onClick={() => onStepClick(index)}
                            className={`
                                shrink-0 w-16 h-16 rounded-lg border-2 transition-all
                                flex flex-col items-center justify-center gap-1
                                ${
                                    isActive
                                        ? "border-yellow-400 bg-yellow-400/20 text-yellow-400"
                                        : isCompleted
                                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                                          : "border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500 hover:bg-gray-700"
                                }
                            `}
                            title={`Step ${index + 1}: ${step.parts.length} parts`}
                        >
                            <span className="text-lg font-bold">
                                {index + 1}
                            </span>
                            <span className="text-xs opacity-75">
                                {step.parts.length} pcs
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></div>
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-400/30 border border-yellow-400"></div>
                    <span>Current</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-700 border border-gray-600"></div>
                    <span>Upcoming</span>
                </div>
            </div>
        </div>
    );
}
