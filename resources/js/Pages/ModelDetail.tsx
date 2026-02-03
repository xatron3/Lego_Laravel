import React, { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import UserMenu from "../components/UserMenu";
import Scene from "../Scene";
import { api, LegoModelData } from "../api";

interface ModelDetailProps {
    id: string;
}

export default function ModelDetail({ id }: ModelDetailProps) {
    const { user, isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [model, setModel] = useState<LegoModelData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
    const [alreadyOwned, setAlreadyOwned] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [loadError, setLoadError] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({
        loaded: 0,
        total: 0,
    });

    useEffect(() => {
        loadModel();
    }, [id, isAuthenticated]);

    const loadModel = async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const data = await api.getModel(parseInt(id));
            setModel(data);
            // Check if user owns this model
            if (isAuthenticated) {
                try {
                    const ownership = await api.checkOwnership(parseInt(id));
                    setAlreadyOwned(ownership.owns);
                } catch (e) {
                    console.error("Failed to check ownership:", e);
                }
            }
        } catch (error) {
            console.error("Failed to load model:", error);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToLibrary = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        setIsAddingToLibrary(true);
        try {
            await api.claimModel(parseInt(id));
            setAlreadyOwned(true);
        } catch (error: any) {
            console.error("Failed to add to library:", error);
            alert(error.message || "Failed to add to library");
        } finally {
            setIsAddingToLibrary(false);
        }
    };

    const handleViewInViewer = () => {
        if (model) {
            router.visit(`/viewer/${model.id}`);
        }
    };

    const isFree = model?.price === null || model?.price === 0;
    const isOwner = user && model?.user_id === user.id;

    return (
        <div className="min-h-screen bg-gray-900">
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
                                className="text-gray-300 hover:text-white transition-colors"
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

            {/* Main Content */}
            <main className="pt-20 pb-12">
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : loadError || !model ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <svg
                            className="w-16 h-16 text-gray-600 mb-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Model Not Found
                        </h2>
                        <p className="text-gray-400 mb-6">
                            The model you're looking for doesn't exist or has
                            been removed.
                        </p>
                        <Link
                            href="/store"
                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                        >
                            Back to Store
                        </Link>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Breadcrumb */}
                        <div className="py-4">
                            <nav className="flex items-center gap-2 text-sm text-gray-400">
                                <Link
                                    href="/store"
                                    className="hover:text-white transition-colors"
                                >
                                    Store
                                </Link>
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
                                <span className="text-white">{model.name}</span>
                            </nav>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* 3D Preview */}
                            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                                <div className="aspect-square relative">
                                    {model.ldr_content ? (
                                        <Canvas
                                            camera={{
                                                position: [100, 100, 100],
                                                fov: 50,
                                            }}
                                        >
                                            <ambientLight intensity={0.6} />
                                            <directionalLight
                                                position={[10, 10, 5]}
                                                intensity={1}
                                            />
                                            <Scene
                                                modelText={model.ldr_content}
                                                currentStep={currentStep}
                                                showGhostParts={false}
                                                dimPreviousSteps={false}
                                                previousStepsOpacity={1}
                                                showCurrentStepBorder={false}
                                                currentStepBorderColor="#facc15"
                                                onLoadingChange={(
                                                    _,
                                                    progress,
                                                ) =>
                                                    setLoadingProgress(progress)
                                                }
                                            />
                                            <OrbitControls
                                                enablePan
                                                enableZoom
                                                enableRotate
                                            />
                                        </Canvas>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                            <svg
                                                className="w-24 h-24 text-gray-600"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {loadingProgress.total > 0 &&
                                    loadingProgress.loaded <
                                        loadingProgress.total && (
                                        <div className="px-4 py-2 bg-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-400 transition-all duration-300"
                                                        style={{
                                                            width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {Math.round(
                                                        (loadingProgress.loaded /
                                                            loadingProgress.total) *
                                                            100,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Model Info */}
                            <div>
                                <div className="mb-4">
                                    {isFree ? (
                                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                                            FREE
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-sm font-bold rounded-full">
                                            ${(model.price ?? 0).toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    {model.name}
                                </h1>

                                {model.description && (
                                    <p className="text-gray-400 text-lg mb-6">
                                        {model.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 mb-6 text-gray-400">
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                        {model.total_parts} parts
                                    </span>
                                    <span className="flex items-center gap-2">
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
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                        </svg>
                                        {model.total_steps} steps
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-bold text-yellow-400">
                                            {model.user?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">
                                            {model.user?.name || "Anonymous"}
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            Creator
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    {isOwner ? (
                                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                            <p className="text-gray-400 text-center">
                                                This is your model
                                            </p>
                                        </div>
                                    ) : alreadyOwned ? (
                                        <>
                                            <button
                                                onClick={handleViewInViewer}
                                                className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all"
                                            >
                                                Open in Viewer
                                            </button>
                                            <p className="text-green-400 text-center text-sm">
                                                ✓ In your library
                                            </p>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleAddToLibrary}
                                            disabled={isAddingToLibrary}
                                            className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {isAddingToLibrary ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                                    Adding...
                                                </span>
                                            ) : isFree ? (
                                                "Add to Library (Free)"
                                            ) : (
                                                `Purchase for $${(model.price ?? 0).toFixed(2)}`
                                            )}
                                        </button>
                                    )}

                                    <button
                                        onClick={handleViewInViewer}
                                        className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors border border-gray-600"
                                    >
                                        Preview in Viewer
                                    </button>
                                </div>

                                {/* Model Details */}
                                <div className="mt-8 pt-8 border-t border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Details
                                    </h3>
                                    <dl className="space-y-3">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-400">
                                                File Name
                                            </dt>
                                            <dd className="text-white">
                                                {model.file_name || "Unknown"}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-400">
                                                Created
                                            </dt>
                                            <dd className="text-white">
                                                {model.created_at
                                                    ? new Date(
                                                          model.created_at,
                                                      ).toLocaleDateString()
                                                    : "Unknown"}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
