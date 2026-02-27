import React, { useEffect, useState, useMemo, useRef } from "react";
import { Head } from "@inertiajs/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useModelLoader } from "../hooks/useModelLoader";
import CompactStepOverlay from "../components/CompactStepOverlay";
import { PartDisplayItem } from "../components/PartsDisplay";
import Scene from "../Scene";
import { api, LegoModelData } from "../api";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import ProUpgradePrompt from "../components/ProUpgradePrompt";
import ViewerHelpModal from "../components/ViewerHelpModal";
import { getPartsForStep } from "../parser";

interface ViewerProps {
  modelId?: string;
}

export default function Home({ modelId }: ViewerProps = {}) {
  const { isAuthenticated } = useAuth();
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
  const [viewerBlocked, setViewerBlocked] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [partsListSize, setPartsListSize] = useState<
    "small" | "medium" | "large"
  >(() => {
    const saved = localStorage.getItem("viewer-parts-size");
    return (saved as "small" | "medium" | "large") || "medium";
  });
  const [hasScrollableContent, setHasScrollableContent] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const orbitControlsRef = useRef<any>(null);
  const partsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSavedModels();
  }, [isAuthenticated]);

  useEffect(() => {
    if (modelId) {
      loadModelById(parseInt(modelId));
    }
  }, [modelId]);

  // Save parts list size to localStorage
  useEffect(() => {
    localStorage.setItem("viewer-parts-size", partsListSize);
  }, [partsListSize]);

  const loadSavedModels = async () => {
    try {
      // Get models user has access to (created or claimed)
      const models = isAuthenticated ? await api.getDashboardModels("all") : [];
      setSavedModels(models);
    } catch (error) {
      console.error("Failed to load saved models:", error);
    }
  };

  const loadModelById = async (id: number) => {
    try {
      setViewerBlocked(false);
      const fullModel = await api.getModel(id);

      if (fullModel.can_access_viewer === false) {
        setViewerBlocked(true);
        setSelectedModelId(id.toString());
        return;
      }

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

  const handleModelSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      await loadModelById(parseInt(id));
    }
  };

  const handlePrevious = () => setCurrentStep((s) => Math.max(0, s - 1));
  const handleNext = () =>
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  const handleLoadingChange = (
    isLoading: boolean,
    progress: { loaded: number; total: number },
  ) => {
    setIsLoadingModel(isLoading);
    setLoadingProgress(progress);
  };

  // Compute parts for current step with image URLs
  const currentStepParts = useMemo<PartDisplayItem[]>(() => {
    if (steps.length === 0 || currentStep >= steps.length) {
      return [];
    }

    const step = steps[currentStep];
    const partCounts = getPartsForStep(step);

    return partCounts.map((partCount) => ({
      partId: partCount.partId,
      colorId: partCount.colorId,
      count: partCount.count,
      imageUrl: `https://cdn.brickoasis.com/images/parts/${partCount.colorId}/${partCount.partId}.png`,
      photoUrl: `https://cdn.rebrickable.com/media/parts/elements/${partCount.partId}.jpg`,
    }));
  }, [steps, currentStep]);

  // Check if parts list has scrollable content
  useEffect(() => {
    const checkScroll = () => {
      if (partsScrollRef.current) {
        const { scrollHeight, clientHeight } = partsScrollRef.current;
        setHasScrollableContent(scrollHeight > clientHeight);
      }
    };
    checkScroll();
    // Recheck when parts or size changes
    const timeoutId = setTimeout(checkScroll, 100);
    return () => clearTimeout(timeoutId);
  }, [currentStepParts, partsListSize]);

  // Calculate parts list dimensions based on size
  const partsListConfig = useMemo(() => {
    const configs = {
      small: { cols: 2, gridClass: "grid-cols-2" },
      medium: { cols: 3, gridClass: "grid-cols-3" },
      large: { cols: 4, gridClass: "grid-cols-4" },
    };
    return configs[partsListSize];
  }, [partsListSize]);

  // Calculate dynamic height to fit all parts
  const partsListHeight = useMemo(() => {
    if (currentStepParts.length === 0) return "auto";
    const cols = partsListConfig.cols;
    const rows = Math.ceil(currentStepParts.length / cols);
    // Each item: aspect-square (varies by col count) + text (40px) + padding (16px) + gap (8px)
    // For better accuracy, account for actual rendered size
    const itemHeight = 110; // Increased to account for image, text, and padding
    const headerHeight = 48; // Header with title and buttons
    const containerPadding = 16; // Top and bottom padding
    const maxHeight = Math.min(window.innerHeight - 120, 700); // Max 700px or screen height - 120px
    const calculatedHeight = Math.min(
      rows * itemHeight + headerHeight + containerPadding,
      maxHeight,
    );
    return `${calculatedHeight}px`;
  }, [currentStepParts.length, partsListConfig.cols]);

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
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        // Show help with '?' key
        e.preventDefault();
        setShowHelpModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>
          3D LEGO Model Viewer - Step-by-Step Building Instructions | BrickOasis
        </title>
        <meta
          name="description"
          content="Interactive 3D LEGO model viewer with step-by-step building instructions. View MOCs in stunning 3D, navigate through building steps, and see detailed parts lists for each step. Upload your Studio files."
        />
        <meta
          name="keywords"
          content="3D LEGO viewer, building instructions, step-by-step instructions, LEGO Studio viewer, BrickLink Studio, interactive viewer"
        />
        <meta
          property="og:title"
          content="3D LEGO Model Viewer - Interactive Building Instructions"
        />
        <meta
          property="og:description"
          content="View LEGO builds in 3D with step-by-step instructions. Upload Studio files and explore builds interactively."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/viewer`} />
      </Head>

      <Header
        onOpenAuthModal={() => setShowAuthModal(true)}
        currentPage="viewer"
      />

      {/* Fullscreen Viewer */}
      <div className="fixed inset-0 pt-18 bg-gray-900">
        <div
          ref={canvasContainerRef}
          className="w-full h-full bg-gray-800 relative"
        >
          {viewerBlocked ? (
            <div className="flex items-center justify-center h-full">
              <ProUpgradePrompt
                feature="3D Instruction Viewer"
                description="The 3D step-by-step instruction viewer is available for Pro members on free community MOCs. Upgrade to Pro to view building instructions for all models."
              />
            </div>
          ) : !modelText ? (
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
                <p className="text-xl font-medium mb-2">No Model Loaded</p>
                <p className="text-sm text-gray-500">
                  Select a model from the dropdown above
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Help Button - Top Right */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="absolute top-2 right-2 z-10 bg-gray-900/80 hover:bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 transition-colors"
                title="Help & Keyboard Shortcuts (?)"
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Model Selector & Parts - Top Left */}
              <div className="absolute top-2 left-2 z-10 w-96 max-w-[calc(100vw-1rem)] space-y-2">
                <select
                  value={selectedModelId}
                  onChange={handleModelSelect}
                  className="w-full bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
                >
                  <option value="">
                    {savedModels.length === 0
                      ? "No models available"
                      : "Choose a model..."}
                  </option>
                  {savedModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.total_steps} steps)
                    </option>
                  ))}
                </select>

                {/* Parts List - Resizable */}
                {steps.length > 0 && currentStepParts.length > 0 && (
                  <div
                    className="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden transition-all duration-300"
                    style={{
                      height: partsListHeight,
                    }}
                  >
                    <div className="flex items-center justify-between p-2 border-b border-gray-700/50 bg-gray-900/50">
                      <h3 className="text-xs font-semibold text-yellow-400">
                        Parts • Step {currentStep + 1} •{" "}
                        <span className="text-gray-400">
                          {currentStepParts.length} piece
                          {currentStepParts.length !== 1 ? "s" : ""}
                        </span>
                      </h3>
                      {/* Size Toggle */}
                      <div className="flex gap-1 bg-gray-800 rounded p-0.5">
                        <button
                          onClick={() => setPartsListSize("small")}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                            partsListSize === "small"
                              ? "bg-yellow-400 text-gray-900 shadow-sm"
                              : "text-gray-400 hover:text-white hover:bg-gray-700"
                          }`}
                          title="Small - 2 columns"
                        >
                          2×
                        </button>
                        <button
                          onClick={() => setPartsListSize("medium")}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                            partsListSize === "medium"
                              ? "bg-yellow-400 text-gray-900 shadow-sm"
                              : "text-gray-400 hover:text-white hover:bg-gray-700"
                          }`}
                          title="Medium - 3 columns"
                        >
                          3×
                        </button>
                        <button
                          onClick={() => setPartsListSize("large")}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                            partsListSize === "large"
                              ? "bg-yellow-400 text-gray-900 shadow-sm"
                              : "text-gray-400 hover:text-white hover:bg-gray-700"
                          }`}
                          title="Large - 4 columns"
                        >
                          4×
                        </button>
                      </div>
                    </div>
                    <div
                      ref={partsScrollRef}
                      className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent scroll-smooth"
                      style={{
                        height: "calc(100% - 48px)",
                      }}
                    >
                      <div className="p-3">
                        <div
                          className={`grid ${partsListConfig.gridClass} gap-2.5`}
                        >
                          {currentStepParts.map((part, idx) => (
                            <div
                              key={`${part.partId}-${part.colorId}-${idx}`}
                              className="bg-gray-800 rounded-lg p-2.5 hover:bg-gray-750 transition-all hover:shadow-lg hover:scale-105"
                            >
                              <div className="relative aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                {part.imageUrl ? (
                                  <img
                                    src={part.imageUrl}
                                    alt={part.partId}
                                    className="max-w-full max-h-full object-contain p-2"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-2xl">🧱</span>
                                )}
                                {/* Quantity Badge */}
                                <div className="absolute top-1 right-1 bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded-full text-xs font-bold shadow-md">
                                  ×{part.count}
                                </div>
                              </div>
                              <div
                                className="text-xs text-gray-400 font-mono truncate text-center"
                                title={part.partId}
                              >
                                {part.partId}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Scroll indicator */}
                    {hasScrollableContent && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-gray-900/95 to-transparent pointer-events-none flex items-end justify-center pb-1">
                        <div className="text-xs text-gray-500 animate-bounce">
                          ↓
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Large Step Navigation Buttons */}
              {steps.length > 0 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 hover:bg-yellow-400 hover:text-gray-900 text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-900/90 disabled:hover:text-white p-4 rounded-full shadow-2xl border border-gray-700 hover:border-yellow-400 transition-all group"
                    title="Previous Step (← or ↑)"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    disabled={currentStep === steps.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 hover:bg-yellow-400 hover:text-gray-900 text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-900/90 disabled:hover:text-white p-4 rounded-full shadow-2xl border border-gray-700 hover:border-yellow-400 transition-all group"
                    title="Next Step (→ or ↓)"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}

              {/* Bottom Overlay - Step Controls */}
              {steps.length > 0 && (
                <div className="absolute bottom-6 left-0 right-0 z-10 px-6">
                  <CompactStepOverlay
                    currentStep={currentStep}
                    totalSteps={steps.length}
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
                </div>
              )}

              <Canvas
                gl={{ preserveDrawingBuffer: true }}
                camera={{
                  position: [400, 300, 400],
                  fov: 45,
                  near: 1,
                  far: 100000,
                }}
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[500, 800, 500]} intensity={1.2} />
                <directionalLight
                  position={[-300, 500, -300]}
                  intensity={0.4}
                />
                <OrbitControls
                  ref={orbitControlsRef}
                  minDistance={50}
                  maxDistance={5000}
                  enableDamping
                  dampingFactor={0.05}
                />
                <Scene
                  modelText={modelText}
                  currentStep={currentStep}
                  showGhostParts={showGhostParts}
                  dimPreviousSteps={dimPreviousSteps}
                  previousStepsOpacity={previousStepsOpacity}
                  showCurrentStepBorder={showCurrentStepBorder}
                  currentStepBorderColor={currentStepBorderColor}
                  onLoadingChange={handleLoadingChange}
                  orbitControlsRef={orbitControlsRef}
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
                          {loadingProgress.loaded} / {loadingProgress.total}{" "}
                          files
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-300"
                          style={{
                            width:
                              loadingProgress.total > 0
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
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <ViewerHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
