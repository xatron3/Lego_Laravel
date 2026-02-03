import { useState } from "react";
import { parseStudioFile, Step } from "../parser";
import { stripBOM } from "../utils/stripBOM";

export function useModelLoader() {
    const [steps, setSteps] = useState<Step[]>([]);
    const [modelText, setModelText] = useState<string | null>(null);

    const loadFile = async (file: File) => {
        const text = await file.text();
        // Strip BOM before parsing and storing to prevent encoding issues
        const cleanText = stripBOM(text);
        const parsed = parseStudioFile(cleanText);
        setSteps(parsed);
        setModelText(cleanText);

        return { steps: parsed, text: cleanText };
    };

    const reset = () => {
        setSteps([]);
        setModelText(null);
    };

    return { steps, modelText, loadFile, reset };
}
