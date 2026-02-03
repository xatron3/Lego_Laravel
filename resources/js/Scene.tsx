import { useEffect, useState } from "react";
import { Group, Object3D } from "three";
import { useSceneLoader } from "./hooks/useSceneLoader";

export default function Scene({
    modelText,
    currentStep,
    onMissingParts,
}: {
    modelText: string;
    currentStep: number;
    onMissingParts?: (parts: string[]) => void;
}) {
    const { model, error, isLoading, missingParts } = useSceneLoader(modelText);
    const [visibleModel, setVisibleModel] = useState<Group | null>(null);

    // Report missing parts to parent
    useEffect(() => {
        if (missingParts.length > 0 && onMissingParts) {
            onMissingParts(missingParts);
        }
    }, [missingParts, onMissingParts]);

    // Update visible object based on current step
    useEffect(() => {
        if (!model) return;

        // Filter visibility based on current step
        // LDrawLoader sets userData.buildingStep on each part
        model.traverse((child: Object3D) => {
            if (child.userData.buildingStep !== undefined) {
                child.visible = child.userData.buildingStep <= currentStep;
            }
        });

        setVisibleModel(model);
    }, [model, currentStep]);

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
