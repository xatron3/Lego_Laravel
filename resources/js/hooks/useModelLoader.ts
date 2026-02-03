import { useState } from "react";
import { parseStudioFile, Step } from "../parser";

export function useModelLoader() {
    const [steps, setSteps] = useState<Step[]>([]);
    const [modelText, setModelText] = useState<string | null>(null);

    const loadFile = async (file: File) => {
        const text = await file.text();
        const parsed = parseStudioFile(text);
        setSteps(parsed);
        setModelText(text);

        return { steps: parsed, text };
    };

    const reset = () => {
        setSteps([]);
        setModelText(null);
    };

    return { steps, modelText, loadFile, reset };
}
