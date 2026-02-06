import { useEffect, useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import Scene from "../Scene";
import PartsDisplay, { PartDisplayItem } from "../components/PartsDisplay";
import { api, LegoModelData, InventoryPartData } from "../api";

interface ModelDetailProps {
    id: string;
}

export default function ModelDetail({ id }: ModelDetailProps) {
    const { user, isAuthenticated } = useAuth();
    const { isInCart, addToCart, removeFromCart } = useCart();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [model, setModel] = useState<LegoModelData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [alreadyOwned, setAlreadyOwned] = useState(false);
    const [ownershipType, setOwnershipType] = useState<string | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState({
        loaded: 0,
        total: 0,
    });
    // Image gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showViewer, setShowViewer] = useState(false);

    // Transform parts data for PartsDisplay component
    const partsForDisplay = useMemo<PartDisplayItem[]>(() => {
        if (!model?.parts) return [];
        return model.parts.map((part) => ({
            partId: part.part_num,
            name: part.name,
            colorId: part.color_id,
            colorName: part.color_name,
            colorRgb: part.color_rgb,
            count: part.quantity,
            imageUrl: part.image_url,
            photoUrl: part.photo_url,
            category: part.category,
            bricklinkUrl: part.bricklink_url,
        }));
    }, [model?.parts]);

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
                    setOwnershipType(ownership.type);
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
            setOwnershipType("claimed");
        } catch (error: any) {
            console.error("Failed to add to library:", error);
            alert(error.message || "Failed to add to library");
        } finally {
            setIsAddingToLibrary(false);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!model?.id) return;

        setIsAddingToCart(true);
        setCartError(null);

        try {
            await addToCart(model.id);
        } catch (error: any) {
            setCartError(error.message || "Failed to add to cart");
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleRemoveFromCart = async () => {
        if (!model?.id) return;

        setIsAddingToCart(true);
        try {
            await removeFromCart(model.id);
        } catch (error: any) {
            console.error("Failed to remove from cart:", error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleRemoveFromLibrary = async () => {
        if (
            !confirm(
                "Are you sure you want to remove this model from your library?",
            )
        ) {
            return;
        }

        setIsRemoving(true);
        try {
            await api.unclaimModel(parseInt(id));
            setAlreadyOwned(false);
            setOwnershipType(null);
        } catch (error: any) {
            console.error("Failed to remove from library:", error);
            alert(error.message || "Failed to remove from library");
        } finally {
            setIsRemoving(false);
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
            <Header currentPage="store" />

            {/* Main Content */}
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {isLoading ? (
                    <LoadingState />
                ) : loadError || !model ? (
                    <ErrorState />
                ) : (
                    <>
                        {/* Back Button */}
                        <button
                            onClick={() => router.visit("/store")}
                            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
                            Back to Store
                        </button>

                        {/* Header Section */}
                        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Image Gallery / 3D Preview */}
                                <div className="lg:w-1/2">
                                    {/* Main Image Display */}
                                    <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden relative mb-3">
                                        {model.images &&
                                        model.images.length > 0 &&
                                        !showViewer ? (
                                            // Show selected image from gallery
                                            <img
                                                src={
                                                    model.images[
                                                        selectedImageIndex
                                                    ]?.url
                                                }
                                                alt={`${model.name} - Image ${selectedImageIndex + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={() => {
                                                    console.error(
                                                        "Image failed to load:",
                                                        model.images?.[
                                                            selectedImageIndex
                                                        ]?.url,
                                                    );
                                                    console.log(
                                                        "Image data:",
                                                        model.images?.[
                                                            selectedImageIndex
                                                        ],
                                                    );
                                                    // Fallback to 3D viewer on error
                                                    setShowViewer(true);
                                                }}
                                            />
                                        ) : model.ldr_content ? (
                                            // Show 3D preview
                                            <Canvas
                                                gl={{
                                                    preserveDrawingBuffer: true,
                                                }}
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
                                                    modelText={
                                                        model.ldr_content
                                                    }
                                                    currentStep={0}
                                                    showGhostParts={false}
                                                    dimPreviousSteps={false}
                                                    previousStepsOpacity={1}
                                                    showCurrentStepBorder={
                                                        false
                                                    }
                                                    currentStepBorderColor="#facc15"
                                                    onLoadingChange={(
                                                        _,
                                                        progress,
                                                    ) =>
                                                        setLoadingProgress(
                                                            progress,
                                                        )
                                                    }
                                                />
                                                <OrbitControls
                                                    enablePan
                                                    enableZoom
                                                    enableRotate
                                                />
                                            </Canvas>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <span className="text-8xl">
                                                    🏗️
                                                </span>
                                            </div>
                                        )}
                                        {loadingProgress.total > 0 &&
                                            loadingProgress.loaded <
                                                loadingProgress.total && (
                                                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3">
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

                                    {/* Thumbnail Gallery */}
                                    {((model.images &&
                                        model.images.length > 0) ||
                                        model.ldr_content) && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {/* Image thumbnails */}
                                            {model.images?.map(
                                                (image, index) => (
                                                    <button
                                                        key={image.id}
                                                        onClick={() => {
                                                            setSelectedImageIndex(
                                                                index,
                                                            );
                                                            setShowViewer(
                                                                false,
                                                            );
                                                        }}
                                                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                                            selectedImageIndex ===
                                                                index &&
                                                            !showViewer
                                                                ? "border-yellow-500"
                                                                : "border-transparent hover:border-gray-500"
                                                        }`}
                                                    >
                                                        <img
                                                            src={image.url}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ),
                                            )}
                                            {/* 3D viewer toggle button */}
                                            {model.ldr_content && (
                                                <button
                                                    onClick={() =>
                                                        setShowViewer(true)
                                                    }
                                                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-gray-600 ${
                                                        showViewer
                                                            ? "border-yellow-500"
                                                            : "border-transparent hover:border-gray-500"
                                                    }`}
                                                    title="3D Preview"
                                                >
                                                    <svg
                                                        className="w-8 h-8 text-gray-300"
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
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="lg:w-1/2">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="mb-2">
                                                {isFree ? (
                                                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                                                        FREE
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-linear-to-r from-yellow-400 to-orange-500 text-gray-900 text-sm font-bold rounded-full">
                                                        $
                                                        {Number(
                                                            model.price ?? 0,
                                                        ).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <h1 className="text-3xl font-bold text-white">
                                                {model.name}
                                            </h1>
                                        </div>
                                    </div>

                                    {model.description && (
                                        <p className="text-gray-400 mb-6">
                                            {model.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <StatCard
                                            label="Total Parts"
                                            value={model.total_parts.toLocaleString()}
                                            icon="🧱"
                                        />
                                        <StatCard
                                            label="Build Steps"
                                            value={model.total_steps.toString()}
                                            icon="📋"
                                        />
                                        <StatCard
                                            label="File Name"
                                            value={model.file_name || "Unknown"}
                                            icon="📄"
                                        />
                                        <StatCard
                                            label="Created"
                                            value={
                                                model.created_at
                                                    ? new Date(
                                                          model.created_at,
                                                      ).toLocaleDateString(
                                                          "en-US",
                                                          {
                                                              month: "short",
                                                              day: "numeric",
                                                              year: "numeric",
                                                          },
                                                      )
                                                    : "Unknown"
                                            }
                                            icon="📅"
                                        />
                                    </div>

                                    {/* Creator Info */}
                                    <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg mb-6">
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-bold text-yellow-400">
                                                {model.user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "?"}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">
                                                {model.user?.name ||
                                                    "Anonymous"}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                Creator
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        {cartError && (
                                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                                {cartError}
                                            </div>
                                        )}

                                        {isOwner ? (
                                            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 text-center">
                                                <p className="text-gray-300">
                                                    ✓ This is your model
                                                </p>
                                            </div>
                                        ) : alreadyOwned ? (
                                            <>
                                                <button
                                                    onClick={handleViewInViewer}
                                                    className="w-full px-6 py-4 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all"
                                                >
                                                    Open in Viewer
                                                </button>
                                                <p className="text-green-400 text-center text-sm">
                                                    ✓ In your library
                                                </p>
                                                {ownershipType === "claimed" &&
                                                    isFree && (
                                                        <button
                                                            onClick={
                                                                handleRemoveFromLibrary
                                                            }
                                                            disabled={
                                                                isRemoving
                                                            }
                                                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 border border-gray-600"
                                                        >
                                                            {isRemoving ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                                                    Removing...
                                                                </span>
                                                            ) : (
                                                                "Remove from Library"
                                                            )}
                                                        </button>
                                                    )}
                                            </>
                                        ) : isFree ? (
                                            // Free model - just claim it
                                            <button
                                                onClick={handleAddToLibrary}
                                                disabled={isAddingToLibrary}
                                                className="w-full px-6 py-4 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {isAddingToLibrary ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Adding...
                                                    </span>
                                                ) : (
                                                    "Add to Library (Free)"
                                                )}
                                            </button>
                                        ) : model.id && isInCart(model.id) ? (
                                            // Paid model already in cart
                                            <>
                                                <div className="p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50 text-center">
                                                    <p className="text-yellow-400 font-medium flex items-center justify-center gap-2">
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
                                                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                        In your cart
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={
                                                        handleRemoveFromCart
                                                    }
                                                    disabled={isAddingToCart}
                                                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 border border-gray-600"
                                                >
                                                    {isAddingToCart
                                                        ? "Removing..."
                                                        : "Remove from Cart"}
                                                </button>
                                            </>
                                        ) : (
                                            // Paid model not in cart
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAddingToCart}
                                                className="w-full px-6 py-4 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {isAddingToCart ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                                        Adding...
                                                    </span>
                                                ) : (
                                                    <>
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
                                                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                        Add to Cart - $
                                                        {Number(
                                                            model.price ?? 0,
                                                        ).toFixed(2)}
                                                    </>
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
                                </div>
                            </div>
                        </div>

                        {/* Parts List Section */}
                        {model.parts && model.parts.length > 0 && (
                            <div className="mt-6">
                                <PartsDisplay
                                    parts={partsForDisplay}
                                    title={`Parts List (${model.parts_count})`}
                                    subtitle={`All ${model.parts_count} unique parts in this model`}
                                    defaultView="table"
                                    showViewToggle={true}
                                    showSearch={true}
                                    allowedViews={["grid", "table", "compact"]}
                                />
                            </div>
                        )}
                    </>
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

// ==================== Shared Components ====================

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: string;
}) {
    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div
                className="text-white text-lg font-bold truncate"
                title={value}
            >
                {value}
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
            <p className="text-gray-400">Loading model...</p>
        </div>
    );
}

function ErrorState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-white mb-2">
                Model Not Found
            </h2>
            <p className="text-gray-400 mb-6">
                The model you're looking for doesn't exist or has been removed.
            </p>
            <button
                onClick={() => router.visit("/store")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
                Back to Store
            </button>
        </div>
    );
}
