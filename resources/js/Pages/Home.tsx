import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useModelLoader } from "../hooks/useModelLoader";
import StepControls from "../components/StepControls";
import Scene from "../Scene";
import { api, LegoModelData } from "../api";

export default function Home() {
    const { steps, modelText, loadFile, reset } = useModelLoader();
    const [currentStep, setCurrentStep] = useState(0);
    const [savedModels, setSavedModels] = useState<LegoModelData[]>([]);
    const [currentFileName, setCurrentFileName] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [modelName, setModelName] = useState("");
    const [modelDescription, setModelDescription] = useState("");

    useEffect(() => {
        loadSavedModels();
    }, []);

    const loadSavedModels = async () => {
        try {
            const models = await api.getModels();
            setSavedModels(models);
        } catch (error) {
            console.error("Failed to load saved models:", error);
        }
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCurrentFileName(file.name);
        await loadFile(file);
        setCurrentStep(0);
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
            });
            await loadSavedModels();
            setShowSaveModal(false);
            setModelName("");
            setModelDescription("");
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

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 shadow-lg border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-yellow-400">
                        LEGO LDraw Studio Viewer
                    </h1>
                    <span className="text-gray-400 text-sm">
                        Laravel + React + Three.js
                    </span>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 flex gap-6">
                <aside className="w-72 shrink-0">
                    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-yellow-400">
                            Saved Models
                        </h2>
                        {savedModels.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No saved models yet
                            </p>
                        ) : (
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
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
                </aside>

                <main className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
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

                        {steps.length > 0 && (
                            <StepControls
                                currentStep={currentStep}
                                totalSteps={steps.length}
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                            />
                        )}
                        {currentFileName && (
                            <span className="text-gray-400 text-sm">
                                {currentFileName}
                            </span>
                        )}
                    </div>

                    <div
                        className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
                        style={{ height: "calc(100vh - 220px)" }}
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
                            <Canvas
                                camera={{ position: [200, 200, 200], fov: 50 }}
                            >
                                <ambientLight intensity={0.6} />
                                <directionalLight
                                    position={[300, 500, 300]}
                                    intensity={1}
                                />
                                <OrbitControls />
                                <Scene
                                    modelText={modelText}
                                    currentStep={currentStep}
                                />
                            </Canvas>
                        )}
                    </div>
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
                            <div className="text-sm text-gray-400">
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
                                onClick={() => setShowSaveModal(false)}
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
        </div>
    );
}
