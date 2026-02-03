import { useEffect, useState } from "react";
import { Group, Object3D, Material } from "three";
import { useSceneLoader } from "./hooks/useSceneLoader";

export default function Scene({
    modelText,
    currentStep,
    showGhostParts = false,
    dimPreviousSteps = true,
    previousStepsOpacity = 0.2,
    onMissingParts,
    onLoadingChange,
}: {
    modelText: string;
    currentStep: number;
    showGhostParts?: boolean;
    dimPreviousSteps?: boolean;
    previousStepsOpacity?: number;
    onMissingParts?: (parts: string[]) => void;
    onLoadingChange?: (
        isLoading: boolean,
        progress: { loaded: number; total: number },
    ) => void;
}) {
    const { model, error, isLoading, missingParts, loadingProgress } =
        useSceneLoader(modelText);
    const [visibleModel, setVisibleModel] = useState<Group | null>(null);
    const materialsCloned = useState(false);

    // Report missing parts to parent
    useEffect(() => {
        if (missingParts.length > 0 && onMissingParts) {
            onMissingParts(missingParts);
        }
    }, [missingParts, onMissingParts]);

    // Report loading state to parent
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(isLoading, loadingProgress);
        }
    }, [isLoading, loadingProgress, onLoadingChange]);

    // Clone materials once when model loads so each part has its own material
    useEffect(() => {
        if (!model || materialsCloned[0]) return;

        // Clone materials recursively for EVERY mesh to ensure no sharing
        const cloneMaterialsRecursive = (obj: Object3D) => {
            if ("material" in obj && obj.material) {
                const mesh = obj as unknown as {
                    material: Material | Material[];
                };

                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map((mat) => mat.clone());
                } else {
                    mesh.material = mesh.material.clone();
                }
            }

            // Recursively clone materials for all children
            obj.children.forEach((child) => cloneMaterialsRecursive(child));
        };

        cloneMaterialsRecursive(model);
        materialsCloned[1](true);
    }, [model, materialsCloned]);

    // Update visible object based on current step with ghost mode support
    useEffect(() => {
        if (!model || !materialsCloned[0]) return;

        console.log(
            "=== Updating opacity for currentStep (0-based):",
            currentStep,
            "===",
        );

        // Helper function to update material opacity recursively
        const updateMaterialOpacity = (obj: Object3D, opacity: number) => {
            if ("material" in obj && obj.material) {
                const mesh = obj as unknown as {
                    material: Material | Material[];
                };

                const updateMaterial = (mat: Material) => {
                    if ("opacity" in mat && "transparent" in mat) {
                        (mat as any).opacity = opacity;
                        (mat as any).transparent = opacity < 1;
                        if ("depthWrite" in mat) {
                            (mat as any).depthWrite = opacity >= 1;
                        }
                        mat.needsUpdate = true;
                    }
                };

                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(updateMaterial);
                } else {
                    updateMaterial(mesh.material);
                }
            }

            // Recursively update all children
            obj.children.forEach((child) =>
                updateMaterialOpacity(child, opacity),
            );
        };

        model.traverse((child: Object3D) => {
            if (child.userData.buildingStep !== undefined) {
                const partStep = child.userData.buildingStep;
                const isCurrentStep = partStep === currentStep;
                const isPreviousStep = partStep < currentStep;
                const isFutureStep = partStep > currentStep;

                // Determine opacity for this part and all its children
                let targetOpacity: number;

                if (isCurrentStep) {
                    // Current step: full opacity (100%)
                    child.visible = true;
                    targetOpacity = 1.0;
                } else if (isPreviousStep) {
                    // Previous steps: use dimming if enabled, otherwise full opacity
                    child.visible = true;
                    targetOpacity = dimPreviousSteps
                        ? previousStepsOpacity
                        : 1.0;
                } else if (isFutureStep && showGhostParts) {
                    // Future steps with ghost mode: faint preview (15%)
                    child.visible = true;
                    targetOpacity = 0.15;
                } else {
                    // Hide future steps when ghost mode is off
                    child.visible = false;
                    return; // Skip opacity update if hidden
                }

                // Update this part and ALL its children recursively
                updateMaterialOpacity(child, targetOpacity);
            }
        });

        setVisibleModel(model);
    }, [
        model,
        currentStep,
        showGhostParts,
        dimPreviousSteps,
        previousStepsOpacity,
        materialsCloned,
    ]);

    if (error)
        return (
            <mesh>
                <boxGeometry />
                <meshBasicMaterial color="red" />
            </mesh>
        );

    if (isLoading || !visibleModel) return null;

    return <primitive object={visibleModel} />;
}
