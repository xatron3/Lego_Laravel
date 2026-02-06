import { useEffect, useState, useRef } from "react";
import {
    Group,
    Object3D,
    Material,
    EdgesGeometry,
    LineSegments,
    LineBasicMaterial,
    BufferGeometry,
    Mesh,
    Box3,
    Vector3,
} from "three";
import { useSceneLoader } from "./hooks/useSceneLoader";
import { useThree } from "@react-three/fiber";

export default function Scene({
    modelText,
    currentStep,
    showGhostParts = false,
    dimPreviousSteps = true,
    previousStepsOpacity = 0.2,
    showCurrentStepBorder = false,
    currentStepBorderColor = "#ef4444",
    onMissingParts,
    onLoadingChange,
    orbitControlsRef,
}: {
    modelText: string;
    currentStep: number;
    showGhostParts?: boolean;
    dimPreviousSteps?: boolean;
    previousStepsOpacity?: number;
    showCurrentStepBorder?: boolean;
    currentStepBorderColor?: string;
    onMissingParts?: (parts: string[]) => void;
    onLoadingChange?: (
        isLoading: boolean,
        progress: { loaded: number; total: number },
    ) => void;
    orbitControlsRef?: React.MutableRefObject<any>;
}) {
    const { model, error, isLoading, missingParts, loadingProgress } =
        useSceneLoader(modelText);
    const [visibleModel, setVisibleModel] = useState<Group | null>(null);
    const materialsCloned = useRef(false);
    const bordersRef = useRef<LineSegments[]>([]);
    const { camera } = useThree();
    const initialCameraSetup = useRef(false);

    // Initial camera setup when model first loads
    useEffect(() => {
        if (!model || !orbitControlsRef?.current || initialCameraSetup.current)
            return;

        initialCameraSetup.current = true;

        // Calculate the bounding box of the entire model
        const box = new Box3().setFromObject(model);
        const center = new Vector3();
        box.getCenter(center);

        const size = new Vector3();
        box.getSize(size);

        // Calculate optimal camera distance to fit the entire model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 2.5; // 2.5x for comfortable initial view

        // Position camera at 45-degree angle for nice initial view
        const angle = Math.PI / 4; // 45 degrees
        const newCameraPos = new Vector3(
            center.x + cameraDistance * Math.cos(angle),
            center.y + cameraDistance * 0.7, // Slightly elevated
            center.z + cameraDistance * Math.sin(angle),
        );

        camera.position.copy(newCameraPos);
        camera.lookAt(center);

        const controls = orbitControlsRef.current;
        if (controls && controls.target) {
            controls.target.copy(center);
            controls.update();
        }
    }, [model, camera, orbitControlsRef]);

    // Reset initial camera setup flag when model changes
    useEffect(() => {
        initialCameraSetup.current = false;
    }, [modelText]);

    // Reset materials cloned state when model changes
    useEffect(() => {
        materialsCloned.current = false;

        // Cleanup borders from previous model
        bordersRef.current.forEach((border) => {
            if (border.geometry) border.geometry.dispose();
            if (border.material) {
                if (Array.isArray(border.material)) {
                    border.material.forEach((m) => m.dispose());
                } else {
                    border.material.dispose();
                }
            }
        });
        bordersRef.current = [];
    }, [model]);

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
        if (!model || materialsCloned.current) return;

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
        materialsCloned.current = true;
    }, [model]);

    // Update visible object based on current step with ghost mode support
    useEffect(() => {
        if (!model || !materialsCloned.current) return;

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

        // Remove all existing border lines from previous renders
        bordersRef.current.forEach((border) => {
            border.parent?.remove(border);
            if (border.geometry) border.geometry.dispose();
            if (border.material) {
                if (Array.isArray(border.material)) {
                    border.material.forEach((m: Material) => m.dispose());
                } else {
                    border.material.dispose();
                }
            }
        });
        bordersRef.current = [];

        let borderCount = 0;

        // Recursive function to add borders to all meshes in current step
        const addBordersToMeshes = (
            obj: Object3D,
            shouldAddBorder: boolean,
        ) => {
            // Add border to this mesh if it's a Mesh and we should add borders
            if (shouldAddBorder && obj.type === "Mesh") {
                const mesh = obj as Mesh;
                if (mesh.geometry && mesh.geometry instanceof BufferGeometry) {
                    try {
                        const edges = new EdgesGeometry(
                            mesh.geometry,
                            89, // Very high threshold to only show outer silhouette, not studs
                        );

                        if (edges.attributes.position.count > 0) {
                            const line = new LineSegments(
                                edges,
                                new LineBasicMaterial({
                                    color: currentStepBorderColor,
                                    transparent: false,
                                    opacity: 1.0,
                                    depthTest: true,
                                    depthWrite: false,
                                }),
                            );
                            line.userData.isBorder = true;
                            line.renderOrder = 999; // Render on top
                            mesh.add(line);
                            bordersRef.current.push(line);
                            borderCount++;
                        }
                    } catch (e) {
                        console.warn("Failed to create edges for mesh:", e);
                    }
                }
            }

            // Recurse to children
            obj.children.forEach((child) =>
                addBordersToMeshes(child, shouldAddBorder),
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

                    // Add borders to all meshes in this part
                    if (showCurrentStepBorder) {
                        addBordersToMeshes(child, true);
                    }
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

        if (showCurrentStepBorder) {
            console.log(
                `Added ${borderCount} borders to current step ${currentStep}`,
            );
        }

        setVisibleModel(model);
    }, [
        model,
        currentStep,
        showGhostParts,
        dimPreviousSteps,
        previousStepsOpacity,
        showCurrentStepBorder,
        currentStepBorderColor,
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
