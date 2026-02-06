import { useState, useEffect, useRef } from "react";
// @ts-expect-error - LDrawLoader types not available in this three.js version
import { LDrawLoader } from "three/examples/jsm/loaders/LDrawLoader.js";
// @ts-expect-error - LDrawConditionalLineMaterial types not available
import { LDrawConditionalLineMaterial } from "three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import { Group, LoadingManager } from "three";
import { stripBOM } from "../utils/stripBOM";

interface UseSceneLoaderResult {
    model: Group | null;
    error: string | null;
    isLoading: boolean;
    missingParts: string[];
    loadingProgress: { loaded: number; total: number };
}

// Helper function to dispose of Three.js objects
const disposeObject = (obj: any) => {
    if (!obj) return;

    // Dispose geometry
    if (obj.geometry) {
        obj.geometry.dispose();
    }

    // Dispose material(s)
    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach((material: any) => {
                if (material.map) material.map.dispose();
                if (material.lightMap) material.lightMap.dispose();
                if (material.bumpMap) material.bumpMap.dispose();
                if (material.normalMap) material.normalMap.dispose();
                if (material.specularMap) material.specularMap.dispose();
                if (material.envMap) material.envMap.dispose();
                material.dispose();
            });
        } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.lightMap) obj.material.lightMap.dispose();
            if (obj.material.bumpMap) obj.material.bumpMap.dispose();
            if (obj.material.normalMap) obj.material.normalMap.dispose();
            if (obj.material.specularMap) obj.material.specularMap.dispose();
            if (obj.material.envMap) obj.material.envMap.dispose();
            obj.material.dispose();
        }
    }

    // Recursively dispose children
    if (obj.children) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
            disposeObject(obj.children[i]);
        }
    }
};

export function useSceneLoader(modelText: string | null): UseSceneLoaderResult {
    const [model, setModel] = useState<Group | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [missingParts, setMissingParts] = useState<string[]>([]);
    const [loadingProgress, setLoadingProgress] = useState({
        loaded: 0,
        total: 0,
    });
    const missingPartsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!modelText || modelText.trim().length === 0) {
            // Dispose old model before clearing
            if (model) {
                disposeObject(model);
            }
            setModel(null);
            setMissingParts([]);
            setLoadingProgress({ loaded: 0, total: 0 });
            setError(null);
            return;
        }

        // Dispose old model before loading new one
        setModel((prevModel) => {
            if (prevModel) {
                disposeObject(prevModel);
            }
            return null;
        });

        setIsLoading(true);
        setError(null);
        setLoadingProgress({ loaded: 0, total: 0 });
        missingPartsRef.current = [];

        // Create a loading manager to track what's being loaded
        const manager = new LoadingManager();

        manager.onStart = (url: string, loaded: number, total: number) => {
            console.log("Loading:", url, `(${loaded}/${total})`);
            setLoadingProgress({ loaded, total });
        };

        manager.onProgress = (url: string, loaded: number, total: number) => {
            console.log("Progress:", url, `(${loaded}/${total})`);
            setLoadingProgress({ loaded, total });
        };

        manager.onLoad = () => {
            console.log("All resources loaded");
            setMissingParts([...missingPartsRef.current]);
        };

        manager.onError = (url: string) => {
            console.warn("Missing LDraw file:", url);
            // Track missing parts but don't fail the whole load
            missingPartsRef.current.push(url);
        };

        const loader = new LDrawLoader(manager);
        // Set the path for loading LDConfig.ldr - this is where the loader looks for config files
        loader.setPath("/ldraw/");
        // Set the parts library path - LDrawLoader will append parts/, p/, models/ to this path
        // Since our files are in /ldraw/parts/, /ldraw/p/, etc., we use "/" and let the
        // Vite middleware resolve the files from their actual location in /ldraw/
        loader.setPartsLibraryPath("/");

        // Set the ConditionalLineMaterial class (required in Three.js r170+)
        // Must be the CLASS itself, not an instance
        loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

        // Optimize loading: disable smooth normals for faster parsing
        // Can be enabled later if higher quality is needed
        loader.smoothNormals = false;

        console.log("Loading materials from LDConfig.ldr");

        // Strip BOM from model text before parsing
        const cleanModelText = stripBOM(modelText);

        // Convert ROTSTEP to STEP so LDrawLoader recognizes all step markers
        const normalizedModelText = cleanModelText.replace(
            /^0 ROTSTEP.*$/gm,
            "0 STEP",
        );

        // Preload materials and then parse the model text directly
        loader
            .preloadMaterials("LDConfig.ldr")
            .then(() => {
                console.log("Materials loaded, parsing model...");
                // Use parse() instead of load() to handle text content directly
                // This allows LDrawLoader to resolve sub-parts from /ldraw/ path
                loader.parse(
                    normalizedModelText,
                    (group: Group) => {
                        console.log("Model parsed successfully");
                        // LDraw uses a different coordinate system - rotate to align with Three.js
                        group.rotation.x = Math.PI;
                        setModel(group);
                        setIsLoading(false);
                        setMissingParts([...missingPartsRef.current]);
                    },
                    (error: unknown) => {
                        console.error("Error parsing model:", error);
                        setError(String(error));
                        setIsLoading(false);
                    },
                );
            })
            .catch((error: unknown) => {
                console.error("Error loading LDraw materials:", error);
                setError(String(error));
                setIsLoading(false);
            });
    }, [modelText]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (model) {
                disposeObject(model);
            }
        };
    }, [model]);

    return { model, error, isLoading, missingParts, loadingProgress };
}
