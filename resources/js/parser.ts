export type PartInstance = {
    partId: string;
    colorId: number;
    position: [number, number, number];
    matrix: number[];
};

export type Step = {
    step: number;
    parts: PartInstance[];
};

export type PartCount = {
    partId: string;
    colorId: number;
    count: number;
};

export function parseStudioFile(text: string): Step[] {
    const lines = text.split(/\r?\n/);
    const steps: Step[] = [];

    let currentStep: Step = { step: 1, parts: [] };

    for (const line of lines) {
        if (line.startsWith("1 ")) {
            const tokens = line.trim().split(/\s+/);

            const colorId = parseInt(tokens[1]);
            const x = parseFloat(tokens[2]);
            const y = parseFloat(tokens[3]);
            const z = parseFloat(tokens[4]);

            const matrix = tokens.slice(5, 14).map(Number);
            const partFile = tokens[14];

            currentStep.parts.push({
                partId: partFile.replace(".dat", ""),
                colorId: colorId === 0 ? 1 : colorId, // Map color 0 to 1 (White)
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

/**
 * Aggregate parts for a specific step into counts
 */
export function getPartsForStep(step: Step): PartCount[] {
    const partMap = new Map<string, PartCount>();

    for (const part of step.parts) {
        const key = `${part.partId}_${part.colorId}`;
        const existing = partMap.get(key);

        if (existing) {
            existing.count++;
        } else {
            partMap.set(key, {
                partId: part.partId,
                colorId: part.colorId,
                count: 1,
            });
        }
    }

    return Array.from(partMap.values());
}
