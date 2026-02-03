export type PartInstance = {
    partId: string;
    position: [number, number, number];
    matrix: number[];
};

export type Step = {
    step: number;
    parts: PartInstance[];
};

export function parseStudioFile(text: string): Step[] {
    const lines = text.split(/\r?\n/);
    const steps: Step[] = [];

    let currentStep: Step = { step: 1, parts: [] };

    for (const line of lines) {
        if (line.startsWith("1 ")) {
            const tokens = line.trim().split(/\s+/);

            const x = parseFloat(tokens[2]);
            const y = parseFloat(tokens[3]);
            const z = parseFloat(tokens[4]);

            const matrix = tokens.slice(5, 14).map(Number);
            const partFile = tokens[14];

            currentStep.parts.push({
                partId: partFile.replace(".dat", ""),
                position: [x, y, z],
                matrix,
            });
        } else if (line.startsWith("0 STEP") || line.startsWith("0 ROTSTEP")) {
            // Push current step and start new one
            if (currentStep.parts.length > 0) {
                steps.push(currentStep);
                currentStep = {
                    step: steps.length + 1,
                    parts: [],
                };
            }
        }
    }

    // Always push the final step if it has parts (even if no trailing STEP command)
    if (currentStep.parts.length > 0) {
        steps.push(currentStep);
    }

    return steps;
}
