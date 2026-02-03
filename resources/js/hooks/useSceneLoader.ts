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
}

export function useSceneLoader(modelText: string | null): UseSceneLoaderResult {
    const [model, setModel] = useState<Group | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [missingParts, setMissingParts] = useState<string[]>([]);
    const missingPartsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!modelText) {
            setModel(null);
            setMissingParts([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        missingPartsRef.current = [];

        // Create a loading manager to track what's being loaded
        const manager = new LoadingManager();

        manager.onStart = (url: string) => {
            console.log("Loading:", url);
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

        console.log("Loading materials from LDConfig.ldr");

        // Strip BOM from model text before parsing
        const cleanModelText = stripBOM(modelText);

        // Preload materials and then parse the model text directly
        loader
            .preloadMaterials("LDConfig.ldr")
            .then(() => {
                console.log("Materials loaded, parsing model...");
                // Use parse() instead of load() to handle text content directly
                // This allows LDrawLoader to resolve sub-parts from /ldraw/ path
                loader.parse(
                    cleanModelText,
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

    return { model, error, isLoading, missingParts };
}
