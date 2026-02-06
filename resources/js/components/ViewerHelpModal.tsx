import React from "react";

interface ViewerHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ViewerHelpModal({
    isOpen,
    onClose,
}: ViewerHelpModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            Viewer Help & Controls
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Keyboard Shortcuts */}
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
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
                                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            Keyboard Shortcuts
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ShortcutItem
                                keys={["←", "→"]}
                                description="Previous / Next Step"
                            />
                            <ShortcutItem
                                keys={["↑", "↓"]}
                                description="Previous / Next Step"
                            />
                            <ShortcutItem
                                keys={["Home"]}
                                description="Go to First Step"
                            />
                            <ShortcutItem
                                keys={["End"]}
                                description="Go to Last Step"
                            />
                            <ShortcutItem
                                keys={["G"]}
                                description="Toggle Ghost Preview"
                            />
                            <ShortcutItem
                                keys={["B"]}
                                description="Toggle Border Highlight"
                            />
                            <ShortcutItem
                                keys={["D"]}
                                description="Toggle Dimming"
                            />
                            <ShortcutItem
                                keys={["?"]}
                                description="Show This Help"
                            />
                        </div>
                    </div>

                    {/* Mouse Controls */}
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
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
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                />
                            </svg>
                            Mouse Controls
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <ControlItem
                                icon="🖱️"
                                action="Left Click + Drag"
                                description="Rotate camera around model"
                            />
                            <ControlItem
                                icon="🖱️"
                                action="Right Click + Drag"
                                description="Pan camera"
                            />
                            <ControlItem
                                icon="🖱️"
                                action="Scroll Wheel"
                                description="Zoom in / out"
                            />
                        </div>
                    </div>

                    {/* Display Options */}
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
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
                            Display Options
                        </h3>
                        <div className="space-y-3 text-gray-300 text-sm">
                            <p>
                                <span className="font-semibold text-yellow-400">
                                    Ghost Preview:
                                </span>{" "}
                                Shows upcoming parts as transparent previews
                            </p>
                            <p>
                                <span className="font-semibold text-yellow-400">
                                    Border Highlight:
                                </span>{" "}
                                Adds colored borders to current step parts
                            </p>
                            <p>
                                <span className="font-semibold text-yellow-400">
                                    Dim Previous Steps:
                                </span>{" "}
                                Makes already-built parts semi-transparent
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}

function ShortcutItem({
    keys,
    description,
}: {
    keys: string[];
    description: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex gap-1">
                {keys.map((key, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && (
                            <span className="text-gray-500 text-sm">/</span>
                        )}
                        <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono text-yellow-400 min-w-8 text-center">
                            {key}
                        </kbd>
                    </React.Fragment>
                ))}
            </div>
            <span className="text-sm text-gray-300">{description}</span>
        </div>
    );
}

function ControlItem({
    icon,
    action,
    description,
}: {
    icon: string;
    action: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
            <span className="text-2xl">{icon}</span>
            <div>
                <div className="font-semibold text-white text-sm">{action}</div>
                <div className="text-xs text-gray-400">{description}</div>
            </div>
        </div>
    );
}
