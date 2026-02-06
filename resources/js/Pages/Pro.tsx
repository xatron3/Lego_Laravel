import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import Scene from "../Scene";
import { useModelLoader } from "../hooks/useModelLoader";
import { api } from "../api";

interface DemoMoc {
    id: number;
    name: string;
    thumbnail: string | null;
    total_parts: number;
    total_steps: number;
    user: { name: string } | null;
}

interface ProProps {
    isPro: boolean;
    demoMocs: DemoMoc[];
    flipLimit: number;
    price: string;
}

export default function Pro({ isPro, demoMocs, flipLimit, price }: ProProps) {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [selectedDemo, setSelectedDemo] = useState<DemoMoc | null>(
        demoMocs[0] || null,
    );

    // Demo viewer state
    const { steps, modelText, loadFile } = useModelLoader();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showGhostParts, setShowGhostParts] = useState(false);
    const [dimPreviousSteps, setDimPreviousSteps] = useState(true);
    const [previousStepsOpacity] = useState(0.2);
    const [showCurrentStepBorder, setShowCurrentStepBorder] = useState(true);
    const [currentStepBorderColor] = useState("#ef4444");
    const [isLoadingModel, setIsLoadingModel] = useState(false);

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        setIsSubscribing(true);
        try {
            const { checkout_url } = await api.subscribePro();
            window.location.href = checkout_url;
        } catch (error: any) {
            console.error("Failed to start subscription:", error);
            alert(error.message || "Failed to start subscription");
        } finally {
            setIsSubscribing(false);
        }
    };

    // Load selected demo model
    useEffect(() => {
        if (!selectedDemo) return;

        const loadDemoModel = async () => {
            setIsLoadingModel(true);
            try {
                const fullModel = await api.getModel(selectedDemo.id);

                // Validate that ldr_content is available
                if (!fullModel.ldr_content) {
                    console.error("Model does not have accessible LDR content");
                    throw new Error(
                        "Model content not accessible. Please configure this model as a Pro demo model in admin settings.",
                    );
                }

                const file = new File(
                    [fullModel.ldr_content],
                    fullModel.file_name || "model.ldr",
                    { type: "text/plain" },
                );
                await loadFile(file);
                setCurrentStep(0);
                setIsPlaying(true);
            } catch (error) {
                console.error("Failed to load demo model:", error);
                alert(
                    error instanceof Error
                        ? error.message
                        : "Failed to load demo model",
                );
            } finally {
                setIsLoadingModel(false);
            }
        };

        loadDemoModel();
    }, [selectedDemo?.id]);

    // Auto-play steps
    useEffect(() => {
        if (!isPlaying || steps.length === 0) return;

        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                const next = prev + 1;
                if (next >= steps.length) {
                    return 0; // Loop back to start
                }
                return next;
            });
        }, 2000); // Change step every 2 seconds

        return () => clearInterval(interval);
    }, [isPlaying, steps.length]);

    const features = [
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                    />
                </svg>
            ),
            title: "3D Instruction Viewer",
            description:
                "Access the full interactive 3D step-by-step building instructions for all free community MOCs. Rotate, zoom, and follow along at your own pace.",
            free: "View details only",
            pro: "Full 3D viewer access",
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                </svg>
            ),
            title: "Unlimited Flip Tracking",
            description: `Free users can track up to ${flipLimit} flip transactions. Go Pro for unlimited buy/sell tracking, matching, and profit analytics.`,
            free: `${flipLimit} transactions`,
            pro: "Unlimited",
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                </svg>
            ),
            title: "MOC Promotion",
            description:
                "Your published MOCs get promoted higher in search results and catalog listings. More visibility means more downloads and sales.",
            free: "Standard listing",
            pro: "Promoted placement",
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
            ),
            title: "Pro Badge",
            description:
                "Stand out with a Pro badge on your profile and MOC listings. Show the community you're a serious builder and supporter.",
            free: "—",
            pro: "Pro badge displayed",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            <Header onOpenAuthModal={() => setShowAuthModal(true)} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background gradient effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
                            <svg
                                className="w-5 h-5 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-yellow-500 font-medium text-sm">
                                BrickVault Pro
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Build More.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                Track Better.
                            </span>
                        </h1>

                        <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                            Unlock the full potential of BrickVault with Pro.
                            Get unlimited flip tracking, full 3D instruction
                            viewer access, and promote your MOCs to the
                            community.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {isPro ? (
                                <div className="inline-flex items-center gap-2 px-8 py-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                                    <svg
                                        className="w-6 h-6 text-green-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="text-green-400 font-semibold text-lg">
                                        You're a Pro member!
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={isSubscribing}
                                        className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {isSubscribing ? (
                                            <span className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                                Processing...
                                            </span>
                                        ) : (
                                            `Get Pro — ${price}/month`
                                        )}
                                    </button>
                                    <p className="text-gray-500 text-sm">
                                        Cancel anytime. No commitment.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Comparison */}
            <section className="py-20 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        What you get with Pro
                    </h2>
                    <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                        Pro unlocks the full BrickVault experience. Here's how
                        it compares to the free tier.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-yellow-500/30 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                                        {feature.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            {feature.description}
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500 uppercase">
                                                    Free:
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {feature.free}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-yellow-500 uppercase">
                                                    Pro:
                                                </span>
                                                <span className="text-sm text-yellow-400 font-medium">
                                                    {feature.pro}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comparison Table */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                            <div className="grid grid-cols-3 gap-0">
                                <div className="p-4 bg-gray-750"></div>
                                <div className="p-4 text-center border-l border-gray-700">
                                    <span className="text-gray-400 font-medium">
                                        Free
                                    </span>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        $0
                                    </p>
                                </div>
                                <div className="p-4 text-center border-l border-yellow-500/30 bg-yellow-500/5">
                                    <span className="text-yellow-400 font-medium">
                                        Pro
                                    </span>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {price}
                                        <span className="text-sm text-gray-400 font-normal">
                                            /mo
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {[
                                {
                                    label: "Browse Catalog",
                                    free: true,
                                    pro: true,
                                },
                                {
                                    label: "Upload MOCs",
                                    free: true,
                                    pro: true,
                                },
                                {
                                    label: "Buy/Sell MOCs",
                                    free: true,
                                    pro: true,
                                },
                                {
                                    label: "3D Viewer (owned MOCs)",
                                    free: true,
                                    pro: true,
                                },
                                {
                                    label: "3D Viewer (free MOCs)",
                                    free: false,
                                    pro: true,
                                },
                                {
                                    label: `Flip Tracking (${flipLimit})`,
                                    free: true,
                                    pro: true,
                                },
                                {
                                    label: "Unlimited Flip Tracking",
                                    free: false,
                                    pro: true,
                                },
                                {
                                    label: "MOC Promotion",
                                    free: false,
                                    pro: true,
                                },
                                {
                                    label: "Pro Badge",
                                    free: false,
                                    pro: true,
                                },
                            ].map((row, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-3 gap-0 border-t border-gray-700/50"
                                >
                                    <div className="p-4 text-sm text-gray-300">
                                        {row.label}
                                    </div>
                                    <div className="p-4 text-center border-l border-gray-700">
                                        {row.free ? (
                                            <svg
                                                className="w-5 h-5 text-green-400 mx-auto"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5 text-gray-600 mx-auto"
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
                                        )}
                                    </div>
                                    <div className="p-4 text-center border-l border-yellow-500/30 bg-yellow-500/5">
                                        {row.pro ? (
                                            <svg
                                                className="w-5 h-5 text-yellow-400 mx-auto"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5 text-gray-600 mx-auto"
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
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Viewer Section */}
            {demoMocs.length > 0 && (
                <section className="py-20 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                        <h2 className="text-3xl font-bold text-white text-center mb-4">
                            Try the 3D Instruction Viewer
                        </h2>
                        <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
                            See how the interactive 3D viewer works with these
                            demo models. Pro members get access to view
                            step-by-step instructions for all free community
                            MOCs.
                        </p>

                        {/* Demo model selector */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {demoMocs.map((moc) => (
                                <button
                                    key={moc.id}
                                    onClick={() => setSelectedDemo(moc)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                        selectedDemo?.id === moc.id
                                            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                                    }`}
                                >
                                    {moc.thumbnail && (
                                        <img
                                            src={moc.thumbnail}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="text-left">
                                        <p className="font-medium text-sm">
                                            {moc.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {moc.total_parts} parts &middot;{" "}
                                            {moc.total_steps} steps
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Interactive 3D Viewer */}
                        {selectedDemo && (
                            <div className="max-w-5xl mx-auto">
                                <div className="relative bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                                    {/* 3D Canvas */}
                                    <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                                        {!modelText || isLoadingModel ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    {isLoadingModel ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin h-12 w-12 text-yellow-400 mx-auto mb-4"
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
                                                            <p className="text-gray-400">
                                                                Loading 3D
                                                                model...
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg
                                                                className="w-16 h-16 text-gray-600 mx-auto mb-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                    d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                                                                />
                                                            </svg>
                                                            <p className="text-gray-400">
                                                                Select a model
                                                                to preview
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
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
                                                    showGhostParts={
                                                        showGhostParts
                                                    }
                                                    dimPreviousSteps={
                                                        dimPreviousSteps
                                                    }
                                                    previousStepsOpacity={
                                                        previousStepsOpacity
                                                    }
                                                    showCurrentStepBorder={
                                                        showCurrentStepBorder
                                                    }
                                                    currentStepBorderColor={
                                                        currentStepBorderColor
                                                    }
                                                    onLoadingChange={() => {}}
                                                />
                                            </Canvas>
                                        )}

                                        {/* Step indicator overlay */}
                                        {modelText && steps.length > 0 && (
                                            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
                                                <p className="text-white font-medium text-sm">
                                                    Step {currentStep + 1} of{" "}
                                                    {steps.length}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls Panel */}
                                    {modelText && steps.length > 0 && (
                                        <div className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 p-6">
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                {/* Playback controls */}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setIsPlaying(
                                                                !isPlaying,
                                                            )
                                                        }
                                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
                                                    >
                                                        {isPlaying ? (
                                                            <>
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                                                </svg>
                                                                <span>
                                                                    Pause
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                                <span>
                                                                    Play
                                                                </span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                setCurrentStep(
                                                                    Math.max(
                                                                        0,
                                                                        currentStep -
                                                                            1,
                                                                    ),
                                                                )
                                                            }
                                                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                            title="Previous step"
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 19l-7-7 7-7"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setCurrentStep(
                                                                    Math.min(
                                                                        steps.length -
                                                                            1,
                                                                        currentStep +
                                                                            1,
                                                                    ),
                                                                )
                                                            }
                                                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                            title="Next step"
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Visual options */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setShowCurrentStepBorder(
                                                                !showCurrentStepBorder,
                                                            )
                                                        }
                                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                            showCurrentStepBorder
                                                                ? "bg-yellow-500 text-gray-900"
                                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                        }`}
                                                        title="Toggle step border"
                                                    >
                                                        Border
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDimPreviousSteps(
                                                                !dimPreviousSteps,
                                                            )
                                                        }
                                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                            dimPreviousSteps
                                                                ? "bg-yellow-500 text-gray-900"
                                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                        }`}
                                                        title="Toggle dimming of previous steps"
                                                    >
                                                        Dim Previous
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setShowGhostParts(
                                                                !showGhostParts,
                                                            )
                                                        }
                                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                            showGhostParts
                                                                ? "bg-yellow-500 text-gray-900"
                                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                        }`}
                                                        title="Toggle ghost parts preview"
                                                    >
                                                        Ghost
                                                    </button>
                                                </div>

                                                {/* CTA */}
                                                {!isPro && (
                                                    <button
                                                        onClick={
                                                            handleSubscribe
                                                        }
                                                        disabled={isSubscribing}
                                                        className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all disabled:opacity-50 text-sm"
                                                    >
                                                        Upgrade to Pro — {price}
                                                        /month
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Model info and CTA */}
                                <div className="mt-6 text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {selectedDemo.name}
                                    </h3>
                                    <p className="text-gray-400 mb-4">
                                        {selectedDemo.total_parts} parts
                                        &middot; {selectedDemo.total_steps}{" "}
                                        building steps
                                        {selectedDemo.user && (
                                            <>
                                                {" "}
                                                &middot; by{" "}
                                                {selectedDemo.user.name}
                                            </>
                                        )}
                                    </p>

                                    {isPro ? (
                                        <Link
                                            href={`/viewer/${selectedDemo.id}`}
                                            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-xl transition-colors"
                                        >
                                            Open Full Viewer
                                        </Link>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            This is a preview — upgrade to Pro
                                            for full access to the interactive
                                            viewer on all free MOCs
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Final CTA */}
            {!isPro && (
                <section className="py-20 border-t border-gray-800">
                    <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to go Pro?
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Join the Pro community and get the most out of
                            BrickVault. Just {price}/month, cancel anytime.
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={isSubscribing}
                            className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25 disabled:opacity-50"
                        >
                            {isSubscribing
                                ? "Processing..."
                                : `Get Pro — ${price}/month`}
                        </button>
                    </div>
                </section>
            )}

            <Footer />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
