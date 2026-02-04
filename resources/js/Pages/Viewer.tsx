import React, { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useModelLoader } from "../hooks/useModelLoader";
import StepControls from "../components/StepControls";
import StepPreview from "../components/StepPreview";
import PartsList from "../components/PartsList";
import Scene from "../Scene";
import { api, LegoModelData } from "../api";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";

interface ViewerProps {
    modelId?: string;
}

export default function Home({ modelId }: ViewerProps = {}) {
    const { user, isAuthenticated } = useAuth();
    const { steps, modelText, loadFile } = useModelLoader();
    const [currentStep, setCurrentStep] = useState(0);
    const [savedModels, setSavedModels] = useState<LegoModelData[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string>("");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showGhostParts, setShowGhostParts] = useState(false);
    const [dimPreviousSteps, setDimPreviousSteps] = useState(true);
    const [previousStepsOpacity, setPreviousStepsOpacity] = useState(0.2);
    const [showCurrentStepBorder, setShowCurrentStepBorder] = useState(false);
    const [currentStepBorderColor, setCurrentStepBorderColor] =
        useState("#ef4444");
    const [isLoadingModel, setIsLoadingModel] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({
        loaded: 0,
        total: 0,
    });

    useEffect(() => {
        loadSavedModels();
    }, [isAuthenticated]);

    useEffect(() => {
        if (modelId) {
            loadModelById(parseInt(modelId));
        }
    }, [modelId]);

    const loadSavedModels = async () => {
        try {
            // Get models user has access to (created or claimed)
            const models = isAuthenticated
                ? await api.getDashboardModels("all")
                : [];
            setSavedModels(models);
        } catch (error) {
            console.error("Failed to load saved models:", error);
        }
    };

    const loadModelById = async (id: number) => {
        try {
            const fullModel = await api.getModel(id);
            const file = new File(
                [fullModel.ldr_content],
                fullModel.file_name || "model.ldr",
                { type: "text/plain" },
            );
            await loadFile(file);
            setCurrentStep(0);
            setSelectedModelId(id.toString());
        } catch (error) {
            console.error("Failed to load model:", error);
            alert("Failed to load model");
        }
    };

    const handleModelSelect = async (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const id = e.target.value;
        if (id) {
            await loadModelById(parseInt(id));
        }
    };

    const handlePrevious = () => setCurrentStep((s) => Math.max(0, s - 1));
    const handleNext = () =>
        setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
    const handleStepClick = (step: number) => setCurrentStep(step);
    const handleLoadingChange = (
        isLoading: boolean,
        progress: { loaded: number; total: number },
    ) => {
        setIsLoadingModel(isLoading);
        setLoadingProgress(progress);
    };

    // Keyboard navigation for steps
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle keyboard shortcuts when not typing in an input/textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (steps.length === 0) return;

            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                handlePrevious();
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "Home") {
                e.preventDefault();
                setCurrentStep(0);
            } else if (e.key === "End") {
                e.preventDefault();
                setCurrentStep(steps.length - 1);
            } else if (e.key === "g" || e.key === "G") {
                // Toggle ghost mode with 'g' key
                setShowGhostParts((prev) => !prev);
            } else if (e.key === "b" || e.key === "B") {
                // Toggle border with 'b' key
                setShowCurrentStepBorder((prev) => !prev);
            } else if (e.key === "d" || e.key === "D") {
                // Toggle dimming with 'd' key
                setDimPreviousSteps((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [steps.length]);

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                onOpenAuthModal={() => setShowAuthModal(true)}
                currentPage="viewer"
            />

            {/* Main Content - Full Screen Viewer */}
            <div className="pt-20 h-screen flex overflow-hidden">
                {/* 3D Viewer - Main Window */}
                <div className="flex-1 bg-gray-800 relative overflow-hidden">
                    {!modelText ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <svg
                                    className="w-20 h-20 mx-auto mb-4 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                                <p className="text-xl font-medium mb-2">
                                    No Model Loaded
                                </p>
                                <p className="text-sm text-gray-500">
                                    Select a model from the dropdown above
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Canvas
                                camera={{
                                    position: [200, 200, 200],
                                    fov: 50,
                                    near: 0.1,
                                    far: 100000,
                                }}
                            >
                                <ambientLight intensity={0.6} />
                                <directionalLight
                                    position={[300, 500, 300]}
                                    intensity={1}
                                />
                                <OrbitControls
                                    minDistance={10}
                                    maxDistance={10000}
                                />
                                <Scene
                                    modelText={modelText}
                                    currentStep={currentStep}
                                    showGhostParts={showGhostParts}
                                    dimPreviousSteps={dimPreviousSteps}
                                    previousStepsOpacity={previousStepsOpacity}
                                    showCurrentStepBorder={
                                        showCurrentStepBorder
                                    }
                                    currentStepBorderColor={
                                        currentStepBorderColor
                                    }
                                    onLoadingChange={handleLoadingChange}
                                />
                            </Canvas>

                            {/* Loading Overlay */}
                            {isLoadingModel && (
                                <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-700">
                                        <div className="flex items-center justify-center mb-4">
                                            <svg
                                                className="animate-spin h-12 w-12 text-yellow-400"
                                                xmlns="http://www.w3.org/2000/svg"
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
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-center text-white mb-2">
                                            Loading Model
                                        </h3>
                                        <p className="text-center text-gray-400 text-sm mb-4">
                                            Loading parts library...
                                        </p>

                                        {/* Progress bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                <span>Progress</span>
                                                <span>
                                                    {loadingProgress.loaded} /{" "}
                                                    {loadingProgress.total}{" "}
                                                    files
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400 transition-all duration-300"
                                                    style={{
                                                        width:
                                                            loadingProgress.total >
                                                            0
                                                                ? `${(loadingProgress.loaded / loadingProgress.total) * 100}%`
                                                                : "0%",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right Sidebar - Compact Controls */}
                <aside className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden overflow-y-auto ">
                    {/* Model Selector */}
                    {savedModels.length > 0 && (
                        <div className="p-4 border-b border-gray-700 flex-shrink-0">
                            <label className="text-xs font-semibold text-gray-400 mb-2 block">
                                SELECT MODEL
                            </label>
                            <select
                                value={selectedModelId}
                                onChange={handleModelSelect}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                <option value="">Choose a model...</option>
                                {savedModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name} ({model.total_steps} steps)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step Controls */}
                    {steps.length > 0 && (
                        <div className="p-4 border-b border-gray-700 flex-shrink-0">
                            <StepControls
                                currentStep={currentStep}
                                totalSteps={steps.length}
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                                showGhostParts={showGhostParts}
                                onToggleGhostParts={() =>
                                    setShowGhostParts(!showGhostParts)
                                }
                                dimPreviousSteps={dimPreviousSteps}
                                onToggleDimPreviousSteps={() =>
                                    setDimPreviousSteps(!dimPreviousSteps)
                                }
                                previousStepsOpacity={previousStepsOpacity}
                                onOpacityChange={setPreviousStepsOpacity}
                                showCurrentStepBorder={showCurrentStepBorder}
                                onToggleCurrentStepBorder={() =>
                                    setShowCurrentStepBorder(
                                        !showCurrentStepBorder,
                                    )
                                }
                                currentStepBorderColor={currentStepBorderColor}
                                onBorderColorChange={setCurrentStepBorderColor}
                            />
                        </div>
                    )}

                    {/* Scrollable Content Area */}
                    {steps.length > 0 && (
                        <div className="flex-1">
                            {/* Step Preview */}
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                                    STEPS
                                </h3>
                                <StepPreview
                                    steps={steps}
                                    currentStep={currentStep}
                                    onStepClick={handleStepClick}
                                />
                            </div>

                            {/* Parts List */}
                            <div className="p-4">
                                <PartsList
                                    steps={steps}
                                    currentStep={currentStep}
                                />
                            </div>
                        </div>
                    )}

                    {/* Empty state when no model loaded */}
                    {steps.length === 0 && savedModels.length > 0 && (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center text-gray-500">
                                <svg
                                    className="w-16 h-16 mx-auto mb-4 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="text-sm">
                                    Select a model above to start
                                </p>
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
