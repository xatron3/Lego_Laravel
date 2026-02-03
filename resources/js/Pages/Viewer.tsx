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
import UserMenu from "../components/UserMenu";

interface ViewerProps {
    modelId?: string;
}

export default function Home({ modelId }: ViewerProps = {}) {
    const { user, isAuthenticated } = useAuth();
    const { steps, modelText, loadFile, reset } = useModelLoader();
    const [currentStep, setCurrentStep] = useState(0);
    const [savedModels, setSavedModels] = useState<LegoModelData[]>([]);
    const [currentFileName, setCurrentFileName] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [modelName, setModelName] = useState("");
    const [modelDescription, setModelDescription] = useState("");
    const [modelIsPublic, setModelIsPublic] = useState(false);
    const [modelPrice, setModelPrice] = useState<string>("");
    const [showGhostParts, setShowGhostParts] = useState(false);
    const [dimPreviousSteps, setDimPreviousSteps] = useState(true);
    const [previousStepsOpacity, setPreviousStepsOpacity] = useState(0.2);
    const [showCurrentStepBorder, setShowCurrentStepBorder] = useState(false);
    const [currentStepBorderColor, setCurrentStepBorderColor] =
        useState("#facc15");
    const [isLoadingModel, setIsLoadingModel] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({
        loaded: 0,
        total: 0,
    });

    useEffect(() => {
        loadSavedModels();
    }, []);

    useEffect(() => {
        if (modelId) {
            loadModelById(parseInt(modelId));
        }
    }, [modelId]);

    const loadSavedModels = async () => {
        try {
            const models = await api.getModels();
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
            setCurrentFileName(fullModel.file_name || "model.ldr");
            await loadFile(file);
            setCurrentStep(0);
        } catch (error) {
            console.error("Failed to load model:", error);
            alert("Failed to load model");
        }
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCurrentStep(0); // Reset step BEFORE loading to ensure proper dimming
        setCurrentFileName(file.name);
        await loadFile(file);
    };

    const handleSave = async () => {
        if (!modelText || !modelName.trim()) return;
        setIsSaving(true);
        try {
            const totalParts = steps.reduce(
                (sum, step) => sum + step.parts.length,
                0,
            );
            await api.saveModel({
                name: modelName.trim(),
                description: modelDescription.trim() || undefined,
                ldr_content: modelText,
                file_name: currentFileName,
                total_steps: steps.length,
                total_parts: totalParts,
                is_public: modelIsPublic,
                price: modelPrice ? parseFloat(modelPrice) : null,
            });
            await loadSavedModels();
            setShowSaveModal(false);
            setModelName("");
            setModelDescription("");
            setModelIsPublic(false);
            setModelPrice("");
        } catch (error) {
            console.error("Failed to save model:", error);
            alert("Failed to save model");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadSavedModel = async (model: LegoModelData) => {
        try {
            const fullModel = await api.getModel(model.id!);
            const file = new File(
                [fullModel.ldr_content],
                fullModel.file_name || "model.ldr",
                { type: "text/plain" },
            );
            setCurrentFileName(fullModel.file_name || "model.ldr");
            await loadFile(file);
            setCurrentStep(0);
        } catch (error) {
            console.error("Failed to load model:", error);
            alert("Failed to load model");
        }
    };

    const handleDeleteModel = async (id: number) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            await api.deleteModel(id);
            await loadSavedModels();
        } catch (error) {
            console.error("Failed to delete model:", error);
            alert("Failed to delete model");
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
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">
                                BrickVault
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                href="/store"
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Store
                            </Link>
                            <Link
                                href="/viewer"
                                className="text-yellow-400 font-medium"
                            >
                                Viewer
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <UserMenu />
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 flex gap-6 pt-20">
                {/* pt-20 for fixed header */}
                {/* Left Sidebar - Saved Models */}
                <aside className="w-72 shrink-0 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
                    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-yellow-400">
                            {isAuthenticated
                                ? "Public Models"
                                : "Available Models"}
                        </h2>
                        {savedModels.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No models available yet
                            </p>
                        ) : (
                            <ul className="space-y-2 max-h-64 overflow-y-auto">
                                {savedModels.map((model) => (
                                    <li
                                        key={model.id}
                                        className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <button
                                                onClick={() =>
                                                    handleLoadSavedModel(model)
                                                }
                                                className="text-left flex-1"
                                            >
                                                <div className="font-medium text-white truncate">
                                                    {model.name}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {model.total_steps} steps -{" "}
                                                    {model.total_parts} parts
                                                </div>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteModel(model.id!)
                                                }
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="Delete"
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
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Step Controls - moved to sidebar when model loaded */}
                    {steps.length > 0 && (
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
                                setShowCurrentStepBorder(!showCurrentStepBorder)
                            }
                            currentStepBorderColor={currentStepBorderColor}
                            onBorderColorChange={setCurrentStepBorderColor}
                        />
                    )}

                    {/* Parts List */}
                    {steps.length > 0 && (
                        <PartsList steps={steps} currentStep={currentStep} />
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col gap-4">
                    {/* Top toolbar */}
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                            </svg>
                            Upload LDraw File
                            <input
                                type="file"
                                accept=".ldr,.mpd"
                                onChange={handleFile}
                                className="hidden"
                            />
                        </label>

                        {modelText && (
                            <>
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                        />
                                    </svg>
                                    Save to Database
                                </button>
                                <button
                                    onClick={() => {
                                        reset();
                                        setCurrentFileName("");
                                        setCurrentStep(0);
                                    }}
                                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                    Clear
                                </button>
                            </>
                        )}

                        {currentFileName && (
                            <span className="text-gray-400 text-sm ml-auto">
                                {currentFileName}
                            </span>
                        )}
                    </div>

                    {/* 3D Viewer */}
                    <div
                        className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex-1 relative"
                        style={{ minHeight: "500px" }}
                    >
                        {!modelText ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
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
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                    <p className="text-lg">
                                        Upload an LDraw file (.ldr or .mpd) to
                                        view your LEGO model
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Or select a saved model from the sidebar
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
                                        previousStepsOpacity={
                                            previousStepsOpacity
                                        }
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
                                                Loading LEGO Model
                                            </h3>
                                            <p className="text-center text-gray-400 text-sm mb-4">
                                                Loading parts library files...
                                            </p>

                                            {/* Progress bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                    <span>Progress</span>
                                                    <span>
                                                        {loadingProgress.loaded}{" "}
                                                        /{" "}
                                                        {loadingProgress.total}{" "}
                                                        files
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
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

                                            <div className="text-xs text-gray-500 text-center">
                                                This may take a moment on first
                                                load
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Step Preview Strip - below the viewer */}
                    {steps.length > 0 && (
                        <StepPreview
                            steps={steps}
                            currentStep={currentStep}
                            onStepClick={handleStepClick}
                        />
                    )}
                </main>
            </div>

            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-yellow-400">
                            Save Model
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Model Name *
                                </label>
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) =>
                                        setModelName(e.target.value)
                                    }
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    placeholder="Enter model name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={modelDescription}
                                    onChange={(e) =>
                                        setModelDescription(e.target.value)
                                    }
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>

                            {/* Visibility Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-gray-300">
                                        Make Public
                                    </span>
                                    <p className="text-xs text-gray-500">
                                        Others can view this model
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setModelIsPublic(!modelIsPublic)
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        modelIsPublic
                                            ? "bg-green-500"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            modelIsPublic
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Price Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Price (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={modelPrice}
                                        onChange={(e) =>
                                            setModelPrice(e.target.value)
                                        }
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="0.00 (Free)"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty or 0 for free
                                </p>
                            </div>

                            <div className="text-sm text-gray-400 p-3 bg-gray-700/30 rounded-lg">
                                <p>Steps: {steps.length}</p>
                                <p>
                                    Parts:{" "}
                                    {steps.reduce(
                                        (sum, step) => sum + step.parts.length,
                                        0,
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowSaveModal(false);
                                    setModelIsPublic(false);
                                    setModelPrice("");
                                }}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!modelName.trim() || isSaving}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
